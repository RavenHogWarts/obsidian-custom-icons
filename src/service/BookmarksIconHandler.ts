import { IconSelector } from "@src/components/icon-picker/IconSelector";
import { LL } from "@src/i18n/i18n";
import type CIPlugin from "@src/main";
import { BookmarkKind, IIcon, IconType } from "@src/types/types";
import {
	IBookmarksConfig,
	isBookmarkKind,
	resolveBookmarkIcon,
} from "@src/util/bookmarkIcon";
import { getLucideIconNames } from "@src/util/getLucideIcons";
import { AbstractIconHandler } from "@src/util/IconHandler";
import setIcon, { cleanupIcon } from "@src/util/setIcon";
import { EventRef, Menu } from "obsidian";

/**
 * 书签内部插件 / 视图形态（Obsidian 未公开 API，按需最小声明；catalyst 虽已声明，
 * 但 getItemDom 返回 unknown、且不想把处理器耦合到深层类型，故就地用最小结构 + as unknown as）。
 *
 * - bookmarkLookup：DOM data-path → 书签项（用于把「行」映射到稳定 id ctime + 类型 type）；
 * - items：书签树（递归含子项），清理时借它 + getItemDom 够到被折叠 detach 缓存的游离行；
 * - getItemDom(item)：书签项 → 其 DOM（TreeItem-like，selfEl 为 .tree-item-self 行元素）。
 */
interface BookmarkItemLike {
	ctime?: number;
	type?: string;
	items?: BookmarkItemLike[];
}
interface BookmarksInstanceLike {
	items?: BookmarkItemLike[];
	bookmarkLookup?: Record<string, BookmarkItemLike>;
}
interface TreeItemDomLike {
	el?: HTMLElement;
	selfEl?: HTMLElement;
}
interface BookmarksViewLike {
	getItemDom?: (item: BookmarkItemLike) => TreeItemDomLike | null | undefined;
}
interface AppInternalPluginsLike {
	internalPlugins?: {
		getEnabledPluginById?: (id: string) => BookmarksInstanceLike | null;
	};
}

/**
 * 书签图标处理器（混合型）。
 *
 * 为书签面板（data-type="bookmarks"）每一行自定义图标，两级解析：
 * 单项覆盖（items[ctime]，右键分配）> 类型默认（types[kind]，设置页配置）> 原生。
 *
 * 与文件浏览器的关键差异（见 dev/260824/书签图标方案.md §1）：
 * - `data-path` 在【外层 .tree-item】上（文件浏览器在 .tree-item-self 上）；
 * - 叶子项【原生已有图标】——故为混合型：组行「插入」（同文件夹，折叠三角后）、
 *   叶子行「隐藏原生 + 插入」（同标签页，加 hostMarkerClass 让 CSS 隐藏原生 .tree-item-icon）；
 * - 类型 / 稳定 id 取自书签内部插件模型（bookmarkLookup[dataPath] → {ctime,type}），
 *   DOM 的 data-path 是标题拼路径、不稳，仅作定位与兜底键。
 *
 * 懒渲染 + 折叠 detach 缓存的增删收口，与文件浏览器同构（MutationObserver + rAF 全量重扫，
 * 清理走模型树 + getItemDom），见方案 §4.3/§4.4。
 *
 * 右键分配：Obsidian 只暴露 file-menu（file/folder）、url-menu（url）两个可用菜单事件，
 * group/search/graph 无事件——它们由「类型默认层」承载（设置页）。用捕获阶段 contextmenu
 * 监听【只记录】被右键的书签行（不碰原生菜单），菜单事件同步触发时据此定位具体行、写单项层。
 */
export default class BookmarksIconHandler extends AbstractIconHandler<IBookmarksConfig> {
	readonly id = "bookmarks";

	/** data-path 在外层 .tree-item 上 */
	private readonly rowSelector = ".tree-item[data-path]";
	private readonly selfSelector = ":scope > .tree-item-self.bookmark";
	private readonly innerSelector = ":scope > .tree-item-inner";
	private readonly iconClass = "custom-icon-bookmarks-icon";
	/** 叶子行加此类 → CSS 隐藏原生 .tree-item-icon（组行不加，保留折叠三角） */
	private readonly hostMarkerClass = "custom-icon-bookmark-host";
	private readonly iconSize = 16;

	private observers: MutationObserver[] = [];
	private ctxCleanups: Array<() => void> = [];
	private rescanHandle: number | null = null;
	private fileMenuRef: EventRef | null = null;
	private urlMenuRef: EventRef | null = null;
	private layoutEventRef: EventRef | null = null;

	/** 捕获阶段记录的「被右键的书签行」；window.setTimeout(0) 在本轮事件后清空，防跨来源串味 */
	private pendingRow: HTMLElement | null = null;

	constructor(private plugin: CIPlugin) {
		super();
	}

	apply(): void {
		if (!this.isEnabled()) {
			this.cleanup();
			return;
		}

		this.registerMenu();
		this.registerLayoutChange();

		this.app.workspace.onLayoutReady(() => {
			this.applyToAll();
			this.setupObservers();
		});
	}

	cleanup(): void {
		this.disconnectObservers();

		if (this.fileMenuRef) {
			this.app.workspace.offref(this.fileMenuRef);
			this.fileMenuRef = null;
		}
		if (this.urlMenuRef) {
			this.app.workspace.offref(this.urlMenuRef);
			this.urlMenuRef = null;
		}
		if (this.layoutEventRef) {
			this.app.workspace.offref(this.layoutEventRef);
			this.layoutEventRef = null;
		}

		this.removeAllIcons();
	}

	isEnabled(): boolean {
		return this.settings?.enable ?? false;
	}

	// ---------------------------------------------------------------------
	// 定位（书签内部插件 + 叶子容器）
	// ---------------------------------------------------------------------

	/** 书签内部插件实例（核心插件可禁用 → 返回 null，全流程优雅 no-op） */
	private getInstance(): BookmarksInstanceLike | null {
		const ip = (this.app as unknown as AppInternalPluginsLike)
			.internalPlugins;
		return ip?.getEnabledPluginById?.("bookmarks") ?? null;
	}

	private getBookmarkContainers(): HTMLElement[] {
		return this.app.workspace
			.getLeavesOfType("bookmarks")
			.map((leaf) => leaf.view.containerEl)
			.filter((el): el is HTMLElement => Boolean(el));
	}

	// ---------------------------------------------------------------------
	// 渲染（幂等 · 混合型）
	// ---------------------------------------------------------------------

	private applyToAll(): void {
		const instance = this.getInstance();
		this.getBookmarkContainers().forEach((container) => {
			container
				.querySelectorAll<HTMLElement>(this.rowSelector)
				.forEach((row) => this.applyToRow(row, instance));
		});
	}

	/** 从模型（优先）/ DOM（兜底）判定书签类型 */
	private resolveKind(
		item: BookmarkItemLike | undefined,
		isGroup: boolean,
	): BookmarkKind {
		const t = item?.type;
		if (t && isBookmarkKind(t)) return t;
		return isGroup ? "group" : "file";
	}

	private applyToRow(
		rowEl: HTMLElement,
		instance: BookmarksInstanceLike | null,
	): void {
		const self = rowEl.querySelector<HTMLElement>(this.selfSelector);
		if (!self) return;

		const dataPath = rowEl.getAttribute("data-path");
		const item = dataPath ? instance?.bookmarkLookup?.[dataPath] : undefined;
		const isGroup =
			self.classList.contains("mod-collapsible") ||
			item?.type === "group";
		const kind = this.resolveKind(item, isGroup);
		// 单项键优先用稳定的 ctime；模型缺失时退回 data-path（graceful degradation）
		const key =
			item?.ctime !== undefined
				? String(item.ctime)
				: (dataPath ?? undefined);

		const resolved = resolveBookmarkIcon(key, kind, this.settings);
		const existing = self.querySelector<HTMLElement>(
			`:scope > .${this.iconClass}`,
		);

		// 未配置（含重置）：移除自插图标 + 去 hostMarkerClass（原生图标恢复可见）
		if (!resolved) {
			if (existing) {
				cleanupIcon(existing);
				existing.remove();
			}
			self.classList.remove(this.hostMarkerClass);
			return;
		}

		// 组：保留折叠三角，仅插入；叶子：隐藏原生图标 + 插入
		if (isGroup) {
			self.classList.remove(this.hostMarkerClass);
		} else {
			self.classList.add(this.hostMarkerClass);
		}

		let iconEl = existing;
		if (!iconEl) {
			iconEl = self.createDiv({ cls: this.iconClass });
			const inner = self.querySelector(this.innerSelector);
			// 组：折叠三角之后、文本之前；叶子：文本之前
			self.insertBefore(iconEl, inner);
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

	private forEachItemDeep(
		items: BookmarkItemLike[],
		fn: (item: BookmarkItemLike) => void,
	): void {
		items.forEach((item) => {
			fn(item);
			if (item.items && item.items.length) {
				this.forEachItemDeep(item.items, fn);
			}
		});
	}

	private removeAllIcons(): void {
		const instance = this.getInstance();
		this.app.workspace.getLeavesOfType("bookmarks").forEach((leaf) => {
			// ① 游离缓存子树：遍历模型树，借 getItemDom(item).selfEl/el 够到被折叠 detach 的行
			const view = leaf.view as unknown as BookmarksViewLike;
			if (instance?.items && view.getItemDom) {
				this.forEachItemDeep(instance.items, (item) => {
					const dom = view.getItemDom?.(item);
					const host = dom?.selfEl ?? dom?.el;
					if (!host) return;
					host.querySelectorAll<HTMLElement>(
						`.${this.iconClass}`,
					).forEach((el) => {
						cleanupIcon(el);
						el.remove();
					});
					host.classList.remove(this.hostMarkerClass);
				});
			}
			// ② 文档树兜底：清理不在模型里的游离图标 + 残留 hostMarkerClass
			const containerEl = leaf.view.containerEl;
			containerEl
				?.querySelectorAll<HTMLElement>(`.${this.iconClass}`)
				.forEach((el) => {
					cleanupIcon(el);
					el.remove();
				});
			containerEl
				?.querySelectorAll<HTMLElement>(`.${this.hostMarkerClass}`)
				.forEach((el) => el.classList.remove(this.hostMarkerClass));
		});
	}

	// ---------------------------------------------------------------------
	// MutationObserver + 捕获阶段 contextmenu 记录
	// ---------------------------------------------------------------------

	private setupObservers(): void {
		this.disconnectObservers();
		this.getBookmarkContainers().forEach((container) => {
			const observer = new MutationObserver((mutations) => {
				if (!this.isEnabled()) return;
				for (const mutation of mutations) {
					// data-path 先插后赋的时序：靠属性变更兜住
					if (mutation.type === "attributes") {
						this.scheduleRescan();
						continue;
					}
					mutation.addedNodes.forEach((node) => {
						if (!node.instanceOf(HTMLElement)) return;
						// 跳过自己插入的图标节点，避免 subtree 自触发死循环
						if (
							node.matches(`.${this.iconClass}`) ||
							node.closest(`.${this.iconClass}`)
						) {
							return;
						}
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

			// 捕获阶段【只记录】被右键的书签行（不 preventDefault、不碰原生菜单）
			const ctxFn = (e: MouseEvent) => {
				const target = e.target as HTMLElement | null;
				const row =
					target?.closest<HTMLElement>(this.rowSelector) ?? null;
				this.pendingRow =
					row && container.contains(row) ? row : null;
				// 本轮事件（含同步触发的 file-menu/url-menu）结束后清空，防跨来源串味
				window.setTimeout(() => {
					this.pendingRow = null;
				}, 0);
			};
			container.addEventListener("contextmenu", ctxFn, {
				capture: true,
			});
			this.ctxCleanups.push(() =>
				container.removeEventListener("contextmenu", ctxFn, {
					capture: true,
				}),
			);
		});
	}

	/** 合并同批 DOM 变更：下一帧按最终 DOM 幂等全量重扫一次。 */
	private scheduleRescan(): void {
		if (this.rescanHandle !== null) return;
		this.rescanHandle = window.requestAnimationFrame(() => {
			this.rescanHandle = null;
			if (!this.isEnabled()) return;
			this.applyToAll();
		});
	}

	private disconnectObservers(): void {
		this.observers.forEach((o) => o.disconnect());
		this.observers = [];
		this.ctxCleanups.forEach((fn) => fn());
		this.ctxCleanups = [];
		this.pendingRow = null;
		if (this.rescanHandle !== null) {
			window.cancelAnimationFrame(this.rescanHandle);
			this.rescanHandle = null;
		}
	}

	private registerLayoutChange(): void {
		if (this.layoutEventRef) return;
		this.layoutEventRef = this.app.workspace.on("layout-change", () => {
			if (!this.isEnabled()) return;
			this.applyToAll();
			this.setupObservers();
		});
	}

	// ---------------------------------------------------------------------
	// 右键菜单（file-menu / url-menu → 追加「设置/重置图标」，写单项层）
	// ---------------------------------------------------------------------

	private registerMenu(): void {
		if (!this.fileMenuRef) {
			this.fileMenuRef = this.app.workspace.on("file-menu", (menu) =>
				this.tryAddMenu(menu),
			);
		}
		if (!this.urlMenuRef) {
			this.urlMenuRef = this.app.workspace.on("url-menu", (menu) =>
				this.tryAddMenu(menu),
			);
		}
	}

	/**
	 * 若本次菜单来自「书签行右键」（pendingRow 落在书签容器内、仍在文档树），
	 * 则据该行解析单项键并追加菜单项。非书签来源（文件浏览器 / 编辑器等）pendingRow 为空 → 跳过。
	 */
	private tryAddMenu(menu: Menu): void {
		if (!this.isEnabled()) return;
		const row = this.pendingRow;
		if (!row || !row.isConnected) return;

		const key = this.resolveKeyFromRow(row);
		if (!key) return;

		menu.addItem((item) =>
			item
				.setTitle(LL.settings.bookmarks.menu.setIcon())
				.setIcon("image")
				.onClick(() => this.openIconPickerFor(key, row)),
		);
		if (this.settings?.items?.[key]?.icon) {
			menu.addItem((item) =>
				item
					.setTitle(LL.settings.bookmarks.menu.resetIcon())
					.setIcon("rotate-ccw")
					.onClick(() => void this.writeItemOverride(key, undefined)),
			);
		}
	}

	/** 行 → 单项键（ctime 优先，模型缺失退回 data-path） */
	private resolveKeyFromRow(row: HTMLElement): string | undefined {
		const dataPath = row.getAttribute("data-path");
		if (!dataPath) return undefined;
		const item = this.getInstance()?.bookmarkLookup?.[dataPath];
		return item?.ctime !== undefined ? String(item.ctime) : dataPath;
	}

	private openIconPickerFor(key: string, sourceEl?: HTMLElement): void {
		const current = this.settings?.items?.[key];
		const modal = new IconSelector(
			this.app,
			this.buildIconItems(),
			current?.type ?? "lucide",
			current?.color,
			(icon, type) => {
				void this.writeItemOverride(key, {
					id: key,
					icon,
					type,
					color: current?.color ?? "",
				});
			},
			sourceEl,
		);
		modal.open();
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
	// 设置写入（整 map 写入，与其它处理器一致）
	// ---------------------------------------------------------------------

	private async writeItemOverride(
		key: string,
		next?: { id: string; icon: string; type: IconType; color: string },
	): Promise<void> {
		const nextMap = { ...(this.settings?.items ?? {}) };
		if (next) {
			nextMap[key] = next;
		} else {
			delete nextMap[key];
		}
		await this.plugin.settingsStore.updateSettingByPath(
			"bookmarks.items",
			nextMap,
		);
	}
}
