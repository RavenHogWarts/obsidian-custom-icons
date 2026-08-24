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
 * 文件浏览器视图内部形态（Obsidian 未公开 API，按需最小声明）。
 *
 * `fileItems` 以 vault 相对路径为键，持有每个文件/夹树项的元素引用；即便树项因
 * 折叠 / 出屏被 Obsidian detach 缓存，引用依旧有效——故清理时可借它够到那些
 * 脱离文档树的游离子树（否则 querySelectorAll 只能扫到当前挂载的节点，残留漏删）。
 * 标题元素在不同 Obsidian 版本叫 `titleEl`（新）或 `selfEl`（旧），取二者兜底。
 */
interface FileExplorerItemLike {
	titleEl?: HTMLElement;
	selfEl?: HTMLElement;
}
interface FileExplorerViewLike {
	fileItems?: Record<string, FileExplorerItemLike>;
}

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
	/** 合并 DOM 变更 → 下一帧一次全量重扫的 rAF 句柄（null = 未排程） */
	private rescanHandle: number | null = null;
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
		this.disconnectObservers();

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
		this.app.workspace.getLeavesOfType("file-explorer").forEach((leaf) => {
			// ① 游离缓存子树：折叠 / 出屏被 Obsidian detach 缓存的树项不是 containerEl
			// 的后代，DOM 查询扫不到；借视图内部 fileItems 的元素引用逐项清理，才能
			// 够到它们——否则关闭功能后这些图标残留，下次展开随缓存节点一起挂回。
			const view = leaf.view as unknown as FileExplorerViewLike;
			const items = view.fileItems;
			if (items) {
				Object.values(items).forEach((item) => {
					const host = item.titleEl ?? item.selfEl;
					host?.querySelectorAll<HTMLElement>(
						`.${this.iconClass}`,
					).forEach((el) => {
						cleanupIcon(el);
						el.remove();
					});
				});
			}
			// ② 文档树兜底：清理不在 fileItems 里的游离图标（根节点 / 异常态 /
			// fileItems 不可用的旧版本）。已被 ① 移除的节点此处自然扫不到。
			leaf.view.containerEl
				?.querySelectorAll<HTMLElement>(`.${this.iconClass}`)
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
		this.disconnectObservers();
		this.getExplorerContainers().forEach((container) => {
			const observer = new MutationObserver((mutations) => {
				if (!this.isEnabled()) return;

				for (const mutation of mutations) {
					// data-path 在节点插入 DOM 后才被赋值的时序（首次展开常见）：
					// childList 那一回合标题还没有 [data-path]、扫不到，靠属性变更兜住。
					if (mutation.type === "attributes") {
						this.scheduleRescan();
						continue;
					}
					mutation.addedNodes.forEach((node) => {
						if (!node.instanceOf(HTMLElement)) return;
						// 跳过我们自己插入的图标节点，避免 subtree 自触发死循环
						if (
							node.matches(`.${this.iconClass}`) ||
							node.closest(`.${this.iconClass}`)
						) {
							return;
						}
						// 新增树节点：合并成下一帧一次幂等全量重扫
						// （scheduleRescan 幂等，一批里多次调用只排程一次）
						this.scheduleRescan();
					});
				}
			});
			observer.observe(container, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["data-path"],
			});
			this.observers.push(observer);
		});
	}

	/**
	 * 合并（coalesce）同一批 DOM 变更：等展开渲染（含 Obsidian 自身首帧 / 动画）
	 * 落定后，于下一帧按最终 DOM 统一全量重扫一次。
	 *
	 * 收口懒渲染的关键：不再赌「新增节点当场就是带 [data-path] 的完整标题」这一时序，
	 * 而是让稳定的 applyToAllExplorers（直接 querySelectorAll 当前所有已渲染标题）兜底。
	 * 其幂等（isSameIcon + setIcon 的 iconStateMap 去重）保证未变化行不写 DOM，
	 * 插入的图标节点又被 observer 回调跳过——故最多 1~2 帧收敛、不自触发死循环。
	 */
	private scheduleRescan(): void {
		if (this.rescanHandle !== null) return;
		this.rescanHandle = window.requestAnimationFrame(() => {
			this.rescanHandle = null;
			if (!this.isEnabled()) return;
			this.applyToAllExplorers();
		});
	}

	private disconnectObservers(): void {
		this.observers.forEach((o) => o.disconnect());
		this.observers = [];
		if (this.rescanHandle !== null) {
			window.cancelAnimationFrame(this.rescanHandle);
			this.rescanHandle = null;
		}
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
