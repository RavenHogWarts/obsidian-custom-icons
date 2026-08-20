import type CIPlugin from "@src/main";
import { IconSelector } from "@src/components/icon-picker/IconSelector";
import { LL } from "@src/i18n/i18n";
import { IIcon, IconType } from "@src/types/types";
import {
	IFileExplorerConfig,
	migrateFileExplorerPaths,
	resolveFileIcon,
	resolveFolderIcon,
} from "@src/util/fileExplorerIcon";
import { getLucideIconNames } from "@src/util/getLucideIcons";
import { AbstractIconHandler } from "@src/util/IconHandler";
import setIcon, { cleanupIcon } from "@src/util/setIcon";
import { EventRef, Menu, TAbstractFile, TFolder, WorkspaceLeaf } from "obsidian";

/**
 * 文件浏览器图标处理器（插入型）。
 *
 * 为左侧文件浏览器（data-type="file-explorer"）的文件夹/文件插入自定义图标。
 * 与 Ribbon/社区插件的「替换型」不同：原生无文件/夹图标，这里是插入新节点。
 *
 * 级联：文件 files[path] ?? extensions[ext] ?? fileDefault；
 *       文件夹 folders[path] ?? folderDefault。解析为 null 时不显示图标。
 *
 * 难点：文件树懒渲染，必须 MutationObserver({childList,subtree})，
 * 而 subtree 会把我们插入的图标也报告为 mutation——回调需过滤自插入节点防死循环。
 */
export default class FileExplorerIconHandler extends AbstractIconHandler<IFileExplorerConfig> {
	readonly id = "fileExplorer";

	private readonly folderTitleSelector =
		".tree-item-self.nav-folder-title[data-path]";
	private readonly fileTitleSelector =
		".tree-item-self.nav-file-title[data-path]";
	private readonly iconClass = "custom-icon-file-explorer-icon";
	private readonly innerSelector = ".tree-item-inner";
	/** 实测 nav 图标 16（与折叠三角一致） */
	private readonly iconSize = 16;

	private observers: MutationObserver[] = [];
	private menuEventRef: EventRef | null = null;
	private renameEventRef: EventRef | null = null;
	private deleteEventRef: EventRef | null = null;
	private layoutEventRef: EventRef | null = null;

	constructor(private plugin: CIPlugin) {
		super();
	}

	apply(): void {
		if (!this.isEnabled()) {
			this.cleanup();
			return;
		}

		this.registerMenu();
		this.registerVaultEvents();
		this.registerLayoutChange();

		this.app.workspace.onLayoutReady(() => {
			this.applyToAllExplorers();
			this.setupObservers();
		});
	}

	cleanup(): void {
		this.observers.forEach((o) => o.disconnect());
		this.observers = [];

		if (this.menuEventRef) {
			this.app.workspace.offref(this.menuEventRef);
			this.menuEventRef = null;
		}
		if (this.layoutEventRef) {
			this.app.workspace.offref(this.layoutEventRef);
			this.layoutEventRef = null;
		}
		if (this.renameEventRef) {
			this.app.vault.offref(this.renameEventRef);
			this.renameEventRef = null;
		}
		if (this.deleteEventRef) {
			this.app.vault.offref(this.deleteEventRef);
			this.deleteEventRef = null;
		}

		this.removeAllIcons();
	}

	isEnabled(): boolean {
		return this.settings?.enable ?? false;
	}

	// ---------------------------------------------------------------------
	// DOM 定位与渲染
	// ---------------------------------------------------------------------

	private getExplorerContainers(): HTMLElement[] {
		return this.app.workspace
			.getLeavesOfType("file-explorer")
			.map((leaf) => leaf.view.containerEl)
			.filter((el): el is HTMLElement => Boolean(el));
	}

	private applyToAllExplorers(): void {
		this.getExplorerContainers().forEach((container) => {
			container
				.querySelectorAll<HTMLElement>(this.folderTitleSelector)
				.forEach((el) => this.applyToTitle(el, true));
			container
				.querySelectorAll<HTMLElement>(this.fileTitleSelector)
				.forEach((el) => this.applyToTitle(el, false));
		});
	}

	private applyToTitle(titleEl: HTMLElement, isFolder: boolean): void {
		const path = titleEl.getAttribute("data-path");
		if (!path) return;

		const resolved = isFolder
			? resolveFolderIcon(path, this.settings)
			: resolveFileIcon(path, this.settings);

		const existing = titleEl.querySelector<HTMLElement>(
			`:scope > .${this.iconClass}`,
		);

		// 无图标：若此前插过则移除（对应重置/默认为空）
		if (!resolved) {
			if (existing) {
				cleanupIcon(existing);
				existing.remove();
			}
			return;
		}

		let iconEl = existing;
		if (!iconEl) {
			iconEl = titleEl.createDiv({ cls: this.iconClass });
			const inner = titleEl.querySelector(this.innerSelector);
			// 文件夹：折叠三角之后、文本之前；文件：文本之前
			titleEl.insertBefore(iconEl, inner);
		} else if (this.isSameIcon(iconEl, resolved)) {
			return; // 幂等：无变化跳过
		}

		setIcon(iconEl, resolved.type, resolved.icon, {
			color: resolved.color,
			size: this.iconSize,
		});

		// 仅当实际渲染出 svg 时记录 data-icon-*，渲染失败留待下一轮重试
		if (iconEl.querySelector("svg")) {
			iconEl.setAttribute("data-icon-type", resolved.type);
			iconEl.setAttribute("data-icon-name", resolved.icon);
			iconEl.setAttribute("data-icon-color", resolved.color ?? "");
		}
	}

	private isSameIcon(iconEl: HTMLElement, icon: IIcon): boolean {
		return (
			iconEl.getAttribute("data-icon-type") === icon.type &&
			iconEl.getAttribute("data-icon-name") === icon.icon &&
			iconEl.getAttribute("data-icon-color") === (icon.color ?? "")
		);
	}

	private removeAllIcons(): void {
		this.getExplorerContainers().forEach((container) => {
			container
				.querySelectorAll<HTMLElement>(`.${this.iconClass}`)
				.forEach((el) => {
					cleanupIcon(el);
					el.remove();
				});
		});
	}

	// ---------------------------------------------------------------------
	// MutationObserver（文件树懒渲染）
	// ---------------------------------------------------------------------

	private setupObservers(): void {
		this.observers.forEach((o) => o.disconnect());
		this.observers = [];
		this.getExplorerContainers().forEach((container) => {
			const observer = new MutationObserver((mutations) => {
				if (!this.isEnabled()) return;

				mutations.forEach((mutation) => {
					mutation.addedNodes.forEach((node) => {
						if (!node.instanceOf(HTMLElement)) return;
						// 跳过我们自己插入的图标节点，避免 subtree 自触发死循环
						if (
							node.matches(`.${this.iconClass}`) ||
							node.closest(`.${this.iconClass}`)
						) {
							return;
						}
						this.applyToElementTree(node);
					});
				});
			});
			observer.observe(container, { childList: true, subtree: true });
			this.observers.push(observer);
		});
	}

	private applyToElementTree(rootEl: HTMLElement): void {
		if (rootEl.matches(this.folderTitleSelector)) {
			this.applyToTitle(rootEl, true);
		} else if (rootEl.matches(this.fileTitleSelector)) {
			this.applyToTitle(rootEl, false);
		}

		rootEl
			.querySelectorAll<HTMLElement>(this.folderTitleSelector)
			.forEach((el) => this.applyToTitle(el, true));
		rootEl
			.querySelectorAll<HTMLElement>(this.fileTitleSelector)
			.forEach((el) => this.applyToTitle(el, false));
	}

	// ---------------------------------------------------------------------
	// 右键菜单：就地分配 / 重置
	// ---------------------------------------------------------------------

	private registerLayoutChange(): void {
		if (this.layoutEventRef) return;
		// 文件浏览器叶子被重建（移入 popout、侧栏开合）时容器会更换，
		// 需重新扫描并挂 observer；applyToAllExplorers 幂等，重复调用安全
		this.layoutEventRef = this.app.workspace.on("layout-change", () => {
			if (!this.isEnabled()) return;
			this.applyToAllExplorers();
			this.setupObservers();
		});
	}

	private registerMenu(): void {
		if (this.menuEventRef) return;
		this.menuEventRef = this.app.workspace.on(
			"file-menu",
			(
				menu: Menu,
				file: TAbstractFile,
				source: string,
				leaf?: WorkspaceLeaf,
			) => {
				if (!this.isEnabled()) return;
				// file-menu 不止文件树触发：文件标签页头 / 面板 more-options / graph、
				// link 等右键也会触发。若不区分来源，本功能的「设置图标」会混入
				// 标签页菜单——与 TabHeaderIconHandler（leaf-menu）的「设置图标」
				// 同菜单并存出现两项（新标签页右键实测如此，且其 file 是隐藏的
				// 关联文件，语义错位）。就地入口只保留在文件浏览器自身的右键菜单。
				if (source !== "file-explorer-context-menu") return;
				const isFolder = file instanceof TFolder;
				const mapKey = isFolder ? "folders" : "files";
				const hasOverride = Boolean(
					this.settings?.[mapKey]?.[file.path]?.icon,
				);

				menu.addItem((item) => {
					item.setTitle(LL.settings.fileExplorer.menu.setIcon())
						.setIcon("image")
						.onClick(() =>
							this.openIconPickerFor(file, isFolder, leaf),
						);
				});

				if (hasOverride) {
					menu.addItem((item) => {
						item.setTitle(
							LL.settings.fileExplorer.menu.resetIcon(),
						)
							.setIcon("rotate-ccw")
							.onClick(() =>
								this.writeOverride(mapKey, file.path, undefined),
							);
					});
				}
			},
		);
	}

	private openIconPickerFor(
		file: TAbstractFile,
		isFolder: boolean,
		leaf?: WorkspaceLeaf,
	): void {
		const mapKey = isFolder ? "folders" : "files";
		const current = this.settings?.[mapKey]?.[file.path];
		// 让弹窗挂到文件浏览器所在窗口（popout 场景下不再错误地叠到主窗口/设置页）。
		// 注意：从文件树触发的 file-menu 不传 leaf，activeDocument 也不可靠，
		// 故直接用被右键文件在浏览器里的真实节点定位其 ownerDocument（ground truth）。
		const sourceEl = this.resolveSourceEl(file, leaf);
		const modal = new IconSelector(
			this.app,
			this.buildIconItems(),
			current?.type ?? "lucide",
			current?.color,
			(icon, type) => {
				void this.writeOverride(mapKey, file.path, {
					id: file.path,
					icon,
					type,
					color: current?.color ?? "",
				});
			},
			sourceEl,
		);
		modal.open();
	}

	/**
	 * 定位弹窗应挂载的窗口（返回该窗口内的一个元素，供 IconSelector 取 ownerDocument）。
	 * 优先级：被右键文件的真实树节点 → 聚焦窗口的浏览器容器 → 事件 leaf → 任一浏览器。
	 */
	private resolveSourceEl(
		file: TAbstractFile,
		leaf?: WorkspaceLeaf,
	): HTMLElement | undefined {
		const explorers = this.getExplorerContainers();

		const matches: HTMLElement[] = [];
		explorers.forEach((container) => {
			container
				.querySelectorAll<HTMLElement>(
					`${this.folderTitleSelector}, ${this.fileTitleSelector}`,
				)
				.forEach((node) => {
					if (node.getAttribute("data-path") === file.path) {
						matches.push(node);
					}
				});
		});

		if (matches.length === 1) return matches[0];
		if (matches.length > 1) {
			// 多窗口都渲染了该项：优先当前聚焦窗口
			return (
				matches.find((n) => n.ownerDocument === activeDocument) ??
				matches[0]
			);
		}

		// 该项未渲染（如所在文件夹已折叠）：退回聚焦窗口的浏览器容器
		const activeExplorer = explorers.find(
			(c) => c.ownerDocument === activeDocument,
		);
		if (activeExplorer) return activeExplorer;

		// 事件带的 leaf（编辑器/视图触发时才有）→ 兜底第一个浏览器
		return leaf?.view.containerEl ?? explorers[0];
	}

	private buildIconItems(): Record<IconType, string[]> {
		const lib = this.plugin.settings.customIconLib;
		return {
			lucide: getLucideIconNames(),
			svg: [
				...lib.svg.map((icon) => icon.id),
				...this.plugin.iconPackStore.getEnabledIconIds(lib.packs),
			],
		};
	}

	// ---------------------------------------------------------------------
	// 设置写入（整 map 写入，因 data-path 含 "." / "/"）
	// ---------------------------------------------------------------------

	private async writeOverride(
		mapKey: "folders" | "files",
		path: string,
		next?: { id: string; icon: string; type: IconType; color: string },
	): Promise<void> {
		const nextMap = { ...(this.settings?.[mapKey] ?? {}) };
		if (next) {
			nextMap[path] = next;
		} else {
			delete nextMap[path];
		}
		await this.plugin.settingsStore.updateSettingByPath(
			`fileExplorer.${mapKey}`,
			nextMap,
		);
	}

	// ---------------------------------------------------------------------
	// vault 事件：rename 迁移 / delete 清理
	// ---------------------------------------------------------------------

	private registerVaultEvents(): void {
		if (!this.renameEventRef) {
			this.renameEventRef = this.app.vault.on(
				"rename",
				(file: TAbstractFile, oldPath: string) => {
					if (!this.isEnabled()) return;
					void this.handleRename(file, oldPath);
				},
			);
		}
		if (!this.deleteEventRef) {
			this.deleteEventRef = this.app.vault.on(
				"delete",
				(file: TAbstractFile) => {
					if (!this.isEnabled()) return;
					void this.handleDelete(file);
				},
			);
		}
	}

	private async handleRename(
		file: TAbstractFile,
		oldPath: string,
	): Promise<void> {
		const isFolder = file instanceof TFolder;
		// 文件重命名：仅迁移 files 精确键。
		// 文件夹重命名：folders 自身 + 子项，且其内部文件的 files 键（按前缀）也要一并迁移。
		await this.migrateMap("files", oldPath, file.path, isFolder);
		if (isFolder) {
			await this.migrateMap("folders", oldPath, file.path, true);
		}
	}

	private async migrateMap(
		mapKey: "folders" | "files",
		oldPath: string,
		newPath: string,
		isFolder: boolean,
	): Promise<void> {
		const current = this.settings?.[mapKey] ?? {};
		const migrated = migrateFileExplorerPaths(
			current,
			oldPath,
			newPath,
			isFolder,
		);
		if (migrated !== current) {
			await this.plugin.settingsStore.updateSettingByPath(
				`fileExplorer.${mapKey}`,
				migrated,
			);
		}
	}

	private async handleDelete(file: TAbstractFile): Promise<void> {
		const isFolder = file instanceof TFolder;
		// 文件删除：删对应 files 键。
		// 文件夹删除：删 folders 自身 + 子项，并清理其内部文件的 files 键（前缀）。
		await this.pruneMap("files", file.path, isFolder);
		if (isFolder) {
			await this.pruneMap("folders", file.path, true);
		}
	}

	private async pruneMap(
		mapKey: "folders" | "files",
		path: string,
		isFolder: boolean,
	): Promise<void> {
		const current = this.settings?.[mapKey] ?? {};
		const prefix = path + "/";
		const nextMap: Record<string, (typeof current)[string]> = {};
		let changed = false;
		for (const [key, value] of Object.entries(current)) {
			if (key === path || (isFolder && key.startsWith(prefix))) {
				changed = true;
				continue;
			}
			nextMap[key] = value;
		}
		if (changed) {
			await this.plugin.settingsStore.updateSettingByPath(
				`fileExplorer.${mapKey}`,
				nextMap,
			);
		}
	}
}
