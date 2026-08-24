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
import { EventRef, Menu, WorkspaceLeaf } from "obsidian";

/**
 * 书签内部插件 / 视图形态（Obsidian 未公开 API，按需最小声明 + as unknown as，
 * 不新增全局 augmentation；catalyst 虽声明了 BookmarksView，但 getItemDom 返回
 * unknown、且未声明 itemDoms 与 bookmarks:bookmarks-menu 事件）。
 *
 * - items：书签树（递归含子项），是「行」的权威来源；
 * - itemDoms：书签项 → 其 DOM 的 WeakMap（TreeItem-like，selfEl 为 .tree-item-self 行元素）。
 *   ✦ 必须用 itemDoms.get()，不能用 view.getItemDom()：后者是【惰性创建】的
 *   （`itemDoms.get(e) || (new f8/v8(...), attachDragHandler(...))`），对从未渲染过的项
 *   会凭空造出 DOM 行并挂上拖拽处理器；只读场景（渲染 / 清理）一律走 WeakMap 查表。
 *
 * ✦ 注意【不用】instance.bookmarkLookup：它只收录「文件夹」与「无 subpath 的文件」两类，
 * 且键是 vault 路径 / url（rebuildBookmarkCache 实现所定），与 DOM 的 data-path
 * （逐级 getItemTitle 拼出的标题路径）语义不同，group/search/graph 压根不在表里。
 */
interface BookmarkItemLike {
	ctime?: number;
	type?: string;
	items?: BookmarkItemLike[];
}
interface BookmarksInstanceLike {
	items?: BookmarkItemLike[];
}
interface TreeItemDomLike {
	el?: HTMLElement;
	selfEl?: HTMLElement;
}
interface BookmarksViewLike {
	itemDoms?: WeakMap<BookmarkItemLike, TreeItemDomLike>;
}
interface AppInternalPluginsLike {
	internalPlugins?: {
		getEnabledPluginById?: (id: string) => BookmarksInstanceLike | null;
	};
}
/**
 * 书签行右键菜单事件（Obsidian 内部触发，catalyst 未声明）。
 * 书签视图行基类的 onContextMenu 结尾同步触发：
 * `workspace.trigger("bookmarks:bookmarks-menu", menu, items)` ——
 * items 为多选时的选中项数组、单选时为 [item]。
 */
interface BookmarksMenuWorkspaceLike {
	on(
		name: "bookmarks:bookmarks-menu",
		callback: (menu: Menu, items: BookmarkItemLike[]) => unknown,
	): EventRef;
}

/**
 * 书签图标处理器（混合型）。
 *
 * 为书签面板（data-type="bookmarks"）每一行自定义图标，两级解析：
 * 单项覆盖（items[ctime]，右键分配）> 类型默认（types[kind]，设置页配置）> 原生。
 *
 * 与文件浏览器的关键差异：
 * - 叶子项【原生已有图标】——故为混合型：组行「插入」（同文件夹，折叠三角后）、
 *   叶子行「隐藏原生 + 插入」（同标签页，加 hostMarkerClass 让 CSS 隐藏原生 .tree-item-icon）；
 * - 「行」由**模型驱动**枚举（items 树 + itemDoms 查表），而非扫 DOM：类型与稳定 id
 *   都取自模型（item.type / item.ctime），且天然覆盖被折叠 detach 缓存的游离行。
 *   DOM 的 data-path 是标题拼路径、不稳，仅在 itemDoms 缺失时作降级兜底。
 *
 * 懒渲染 + 折叠 detach 缓存的增删收口，与文件浏览器同构（MutationObserver + rAF 全量重扫）。
 *
 * 右键分配：走 Obsidian 内部事件 `bookmarks:bookmarks-menu`，菜单实例来自
 * public 的 `Menu.forEvent(evt)`（其 show 被 setTimeout 推迟到本轮事件之后，
 * 故 trigger 时同步 addItem 的项一定进得去）。该事件由**行基类**触发，
 * 六种书签类型（file/folder/group/search/graph/url）一视同仁，全部可右键分配。
 */
export default class BookmarksIconHandler extends AbstractIconHandler<IBookmarksConfig> {
	readonly id = "bookmarks";

	/** data-path 在外层 .tree-item 上（仅降级兜底路径使用） */
	private readonly rowSelector = ".tree-item[data-path]";
	private readonly selfSelector = ":scope > .tree-item-self.bookmark";
	private readonly innerSelector = ":scope > .tree-item-inner";
	private readonly iconClass = "custom-icon-bookmarks-icon";
	/** 叶子行加此类 → CSS 隐藏原生 .tree-item-icon（组行不加，保留折叠三角） */
	private readonly hostMarkerClass = "custom-icon-bookmark-host";
	private readonly iconSize = 16;

	private observers: MutationObserver[] = [];
	private rescanHandle: number | null = null;
	private menuEventRef: EventRef | null = null;
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
		this.registerLayoutChange();

		this.app.workspace.onLayoutReady(() => {
			this.applyToAll();
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

	private getBookmarkLeaves(): WorkspaceLeaf[] {
		return this.app.workspace.getLeavesOfType("bookmarks");
	}

	private getItemDoms(
		leaf: WorkspaceLeaf,
	): WeakMap<BookmarkItemLike, TreeItemDomLike> | undefined {
		return (leaf.view as unknown as BookmarksViewLike).itemDoms;
	}

	private forEachItemDeep(
		items: BookmarkItemLike[],
		fn: (item: BookmarkItemLike) => void,
	): void {
		items.forEach((item) => {
			fn(item);
			if (item.items?.length) {
				this.forEachItemDeep(item.items, fn);
			}
		});
	}

	/** 单项键 = 稳定 id ctime（Obsidian 自身亦以 `item-${ctime}` 标识书签行） */
	private keyOf(item: BookmarkItemLike): string | undefined {
		return item.ctime !== undefined ? String(item.ctime) : undefined;
	}

	// ---------------------------------------------------------------------
	// 渲染（幂等 · 混合型 · 模型驱动）
	// ---------------------------------------------------------------------

	private applyToAll(): void {
		const items = this.getInstance()?.items;

		this.getBookmarkLeaves().forEach((leaf) => {
			const doms = this.getItemDoms(leaf);
			if (items?.length && doms) {
				this.forEachItemDeep(items, (item) => {
					const self = doms.get(item)?.selfEl;
					if (!self) return; // 未渲染过的项：跳过，绝不惰性创建
					this.applyToRow(
						self,
						this.resolveKind(item, self),
						this.keyOf(item),
					);
				});
				return;
			}
			// 降级：内部形态变动（itemDoms 缺失）时退回扫 DOM，
			// 类型只能由 mod-collapsible 粗判 → 仅类型默认层生效，单项覆盖失效。
			this.applyViaDom(leaf);
		});
	}

	private applyViaDom(leaf: WorkspaceLeaf): void {
		leaf.view.containerEl
			?.querySelectorAll<HTMLElement>(this.rowSelector)
			.forEach((row) => {
				const self = row.querySelector<HTMLElement>(this.selfSelector);
				if (!self) return;
				this.applyToRow(self, this.resolveKind(undefined, self));
			});
	}

	/** 从模型（优先）/ DOM（兜底）判定书签类型 */
	private resolveKind(
		item: BookmarkItemLike | undefined,
		self: HTMLElement,
	): BookmarkKind {
		const t = item?.type;
		if (t && isBookmarkKind(t)) return t;
		return self.classList.contains("mod-collapsible") ? "group" : "file";
	}

	private applyToRow(
		self: HTMLElement,
		kind: BookmarkKind,
		key?: string,
	): void {
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
		self.classList.toggle(this.hostMarkerClass, kind !== "group");

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

	private removeAllIcons(): void {
		const items = this.getInstance()?.items;

		this.getBookmarkLeaves().forEach((leaf) => {
			// ① 游离缓存子树：借 itemDoms 查表够到被折叠 detach 的行
			//    （用 .get() 而非 getItemDom()，避免为未渲染项惰性造 DOM）
			const doms = this.getItemDoms(leaf);
			if (items?.length && doms) {
				this.forEachItemDeep(items, (item) => {
					const dom = doms.get(item);
					const host = dom?.selfEl ?? dom?.el;
					if (host) this.stripIcons(host);
				});
			}
			// ② 文档树兜底：清理不在模型里的游离图标 + 残留 hostMarkerClass
			const containerEl = leaf.view.containerEl;
			if (containerEl) this.stripIcons(containerEl);
		});
	}

	private stripIcons(host: HTMLElement): void {
		host.querySelectorAll<HTMLElement>(`.${this.iconClass}`).forEach(
			(el) => {
				cleanupIcon(el);
				el.remove();
			},
		);
		host.classList.remove(this.hostMarkerClass);
		host.querySelectorAll<HTMLElement>(
			`.${this.hostMarkerClass}`,
		).forEach((el) => el.classList.remove(this.hostMarkerClass));
	}

	// ---------------------------------------------------------------------
	// MutationObserver（书签树懒渲染 + 折叠 detach 缓存）
	// ---------------------------------------------------------------------

	private setupObservers(): void {
		this.disconnectObservers();
		this.getBookmarkLeaves().forEach((leaf) => {
			const container = leaf.view.containerEl;
			if (!container) return;

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
	// 右键菜单（bookmarks:bookmarks-menu → 追加「设置/重置图标」，写单项层）
	// ---------------------------------------------------------------------

	private registerMenu(): void {
		if (this.menuEventRef) return;
		this.menuEventRef = (
			this.app.workspace as unknown as BookmarksMenuWorkspaceLike
		).on("bookmarks:bookmarks-menu", (menu, items) =>
			this.addMenuItems(menu, items),
		);
	}

	/**
	 * 事件已保证来源是书签行（且给出具体 item），无需再猜来源或记录被右键的行。
	 * 多选时 items 为全部选中项 → 一次分配 / 重置作用于所有选中书签。
	 */
	private addMenuItems(menu: Menu, items: BookmarkItemLike[]): void {
		if (!this.isEnabled()) return;

		const keys = items
			.map((item) => this.keyOf(item))
			.filter((key): key is string => Boolean(key));
		if (!keys.length) return;

		menu.addItem((menuItem) =>
			menuItem
				.setSection("action")
				.setTitle(LL.settings.bookmarks.menu.setIcon())
				.setIcon("image")
				.onClick(() => this.openIconPickerFor(keys, items[0])),
		);

		if (keys.some((key) => this.settings?.items?.[key]?.icon)) {
			menu.addItem((menuItem) =>
				menuItem
					.setSection("action")
					.setTitle(LL.settings.bookmarks.menu.resetIcon())
					.setIcon("rotate-ccw")
					.onClick(() => void this.writeItemOverrides(keys)),
			);
		}
	}

	/** 取该书签项已渲染的行元素，供弹窗定位到正确窗口（popout） */
	private findRowEl(item?: BookmarkItemLike): HTMLElement | undefined {
		if (!item) return undefined;
		for (const leaf of this.getBookmarkLeaves()) {
			const dom = this.getItemDoms(leaf)?.get(item);
			const el = dom?.selfEl ?? dom?.el;
			if (el?.isConnected) return el;
		}
		return undefined;
	}

	private openIconPickerFor(
		keys: string[],
		sourceItem?: BookmarkItemLike,
	): void {
		const current = this.settings?.items?.[keys[0]];
		const modal = new IconSelector(
			this.app,
			this.buildIconItems(),
			current?.type ?? "lucide",
			current?.color,
			(icon, type) => {
				void this.writeItemOverrides(keys, {
					icon,
					type,
					color: current?.color ?? "",
				});
			},
			this.findRowEl(sourceItem),
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

	/** next 省略 = 重置（删除这些键） */
	private async writeItemOverrides(
		keys: string[],
		next?: { icon: string; type: IconType; color: string },
	): Promise<void> {
		const nextMap = { ...(this.settings?.items ?? {}) };
		keys.forEach((key) => {
			if (next) {
				nextMap[key] = { id: key, ...next };
			} else {
				delete nextMap[key];
			}
		});
		await this.plugin.settingsStore.updateSettingByPath(
			"bookmarks.items",
			nextMap,
		);
	}
}
