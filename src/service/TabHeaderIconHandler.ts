import { IconSelector } from "@src/components/icon-picker/IconSelector";
import { LL } from "@src/i18n/i18n";
import type CIPlugin from "@src/main";
import { IIcon, IconType, ITabHeaderIconOverride } from "@src/types/types";
import { getLucideIconNames } from "@src/util/getLucideIcons";
import { AbstractIconHandler } from "@src/util/IconHandler";
import setIcon, { cleanupIcon } from "@src/util/setIcon";
import { EventRef, Menu, WorkspaceLeaf } from "obsidian";

interface ITabHeaderConfig {
	enable: boolean;
	data: Record<string, ITabHeaderIconOverride>;
}

/**
 * 标签页图标处理器（隐藏原生 + 插入自定义，混合型）。
 *
 * 为工作区标签页头（.workspace-tab-header[data-type]，含侧栏工具页与编辑器标签）
 * 按视图类型（data-type）自定义图标。
 *
 * 与其它处理器的定位差异：
 * - vs Ribbon（替换型）：以稳定、非本地化的 data-type 为键，优于 aria-label；
 * - vs 社区插件（插入型）：标签页原生已有图标 svg，用户要求「原生结构不删除，
 *   用 CSS display:none 隐藏，另插自定义图标」——故为「隐藏原生 + 插入自定义」的混合型。
 *
 * 语义为「按类型」而非「按单个标签」：同一 data-type 的所有标签共享一个图标
 * （编辑器 markdown/canvas 会有多个标签，分配后该类型全部标签统一图标）。
 *
 * 难点：
 * - 标签页头分布于左右侧栏、主编辑区与所有 popout 窗口，需跨窗口遍历（区别于 Ribbon 仅主窗口）；
 * - 开合/拖拽/切换激活态会增删标签、且原生可能重建 inner，需 MutationObserver 兜住；
 *   而 subtree 会把我们插入的 .custom-icon 也报告为 mutation——回调需过滤自插入节点防死循环；
 * - 右键入口借助 obsidian-typings（catalyst）暴露的未公开事件 workspace.on("leaf-menu")：
 *   leaf 右键菜单打开时向原生 Menu「追加」菜单项，原生项（关闭/固定/移到新窗口等）完整保留，
 *   无需 DOM contextmenu + preventDefault（那会吞掉原生菜单）。leaf.view.getViewType() 即 data-type，
 *   workspace 事件天然覆盖全部窗口（含 popout），无需逐 document 绑定。
 */
export default class TabHeaderIconHandler extends AbstractIconHandler<ITabHeaderConfig> {
	readonly id = "tabHeader";

	private readonly tabSelector = ".workspace-tab-header[data-type]";
	private readonly innerSelector = ".workspace-tab-header-inner";
	private readonly containerSelector = ".workspace-tab-header-container";
	private readonly nativeIconSelector =
		":scope > .workspace-tab-header-inner > .workspace-tab-header-inner-icon:not(.custom-icon)";
	/** 与社区插件一致的自定义节点命名 */
	private readonly customIconClass = "custom-icon";
	/** CSS 据此 display:none 原生图标的钩子类名 */
	private readonly hostMarkerClass = "custom-icon-tab-header";
	/** 实测标签页图标 16（与文件浏览器/设置页一致） */
	private readonly iconSize = 16;

	private observers: MutationObserver[] = [];
	private layoutEventRef: EventRef | null = null;
	private leafMenuEventRef: EventRef | null = null;

	constructor(private plugin: CIPlugin) {
		super();
	}

	apply(): void {
		if (!this.isEnabled()) {
			this.cleanup();
			return;
		}

		this.registerContextMenu();
		this.registerLayoutChange();

		this.app.workspace.onLayoutReady(() => {
			this.applyToAll();
			this.setupObservers();
		});
	}

	cleanup(): void {
		this.observers.forEach((o) => o.disconnect());
		this.observers = [];

		if (this.layoutEventRef) {
			this.app.workspace.offref(this.layoutEventRef);
			this.layoutEventRef = null;
		}

		if (this.leafMenuEventRef) {
			this.app.workspace.offref(this.leafMenuEventRef);
			this.leafMenuEventRef = null;
		}

		this.removeAllIcons();
	}

	isEnabled(): boolean {
		return this.settings?.enable ?? false;
	}

	// ---------------------------------------------------------------------
	// 跨窗口定位
	// ---------------------------------------------------------------------

	/**
	 * 收集主窗口与所有 popout 窗口的根 document。
	 * 经 iterateAllLeaves 取每个叶子的 ownerDocument 去重，比硬查 floatingSplit 内部结构更稳。
	 */
	private getRootDocuments(): Document[] {
		const docs = new Set<Document>();
		docs.add(this.app.workspace.containerEl.doc);
		this.app.workspace.iterateAllLeaves((leaf) => {
			const doc = leaf.view.containerEl?.ownerDocument;
			if (doc) docs.add(doc);
		});
		return Array.from(docs);
	}

	private getTabs(): HTMLElement[] {
		return this.getRootDocuments().flatMap((doc) =>
			Array.from(doc.querySelectorAll<HTMLElement>(this.tabSelector)),
		);
	}

	/** 未分配 → null（不改动，保留原生图标）；已分配 → 归一化后的图标 */
	private resolve(dataType: string): IIcon | null {
		const o = this.settings?.data?.[dataType];
		if (!o?.icon || !o.type) return null;
		return { id: dataType, icon: o.icon, type: o.type, color: o.color };
	}

	// ---------------------------------------------------------------------
	// 渲染单个标签（幂等 + 隐藏原生 + 插入自定义）
	// ---------------------------------------------------------------------

	private applyToAll(): void {
		this.getTabs().forEach((tabEl) => this.applyToTab(tabEl));
	}

	private applyToTab(tabEl: HTMLElement): void {
		const dataType = tabEl.dataset.type;
		if (!dataType) return;

		const inner = tabEl.querySelector<HTMLElement>(
			`:scope > ${this.innerSelector}`,
		);
		if (!inner) return;

		const resolved = this.resolve(dataType);
		const existing = inner.querySelector<HTMLElement>(
			`:scope > .${this.customIconClass}`,
		);

		// 未分配（含重置）：移除自定义节点 + 去 hostMarkerClass，原生图标随之恢复可见
		if (!resolved) {
			if (existing) {
				cleanupIcon(existing);
				existing.remove();
			}
			tabEl.classList.remove(this.hostMarkerClass);
			return;
		}

		// 已分配：加 hostMarkerClass（CSS 隐藏原生），插入/更新自定义兄弟节点
		tabEl.classList.add(this.hostMarkerClass);

		let iconEl = existing;
		if (!iconEl) {
			// 复用原生图标容器类名，插到原生图标节点之前（位置与原生一致）
			iconEl = createDiv({
				cls: ["workspace-tab-header-inner-icon", this.customIconClass],
			});
			const nativeIcon = inner.querySelector<HTMLElement>(
				this.nativeIconSelector,
			);
			inner.insertBefore(iconEl, nativeIcon ?? inner.firstChild);
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
		this.getTabs().forEach((tabEl) => {
			const customEl = tabEl.querySelector<HTMLElement>(
				`:scope > ${this.innerSelector} > .${this.customIconClass}`,
			);
			if (customEl) {
				// 清 setIcon 的 WeakMap，避免「重置后再分配同一图标」被去重跳过而空白
				cleanupIcon(customEl);
				customEl.remove();
			}
			tabEl.classList.remove(this.hostMarkerClass);
		});
	}

	// ---------------------------------------------------------------------
	// MutationObserver（标签增删 + 原生重建 inner）
	// ---------------------------------------------------------------------

	private setupObservers(): void {
		this.observers.forEach((o) => o.disconnect());
		this.observers = [];

		this.getRootDocuments().forEach((doc) => {
			const containers = Array.from(
				doc.querySelectorAll<HTMLElement>(this.containerSelector),
			);
			// 退一步：无容器时挂 body，保证 popout 早期结构也能被捕获
			const targets = containers.length ? containers : [doc.body];

			targets.forEach((target) => {
				const observer = new MutationObserver((mutations) => {
					if (!this.isEnabled()) return;

					mutations.forEach((mutation) => {
						mutation.addedNodes.forEach((node) => {
							if (!node.instanceOf(HTMLElement)) return;
							// 防自触发：跳过我们插入的 .custom-icon（否则 subtree 死循环）
							if (
								node.matches(`.${this.customIconClass}`) ||
								node.closest(`.${this.customIconClass}`)
							) {
								return;
							}
							this.applyToElementTree(node);
						});
					});
				});
				observer.observe(target, { childList: true, subtree: true });
				this.observers.push(observer);
			});
		});
	}

	private applyToElementTree(rootEl: HTMLElement): void {
		if (rootEl.matches(this.tabSelector)) {
			this.applyToTab(rootEl);
		}
		rootEl
			.querySelectorAll<HTMLElement>(this.tabSelector)
			.forEach((el) => this.applyToTab(el));
	}

	// ---------------------------------------------------------------------
	// layout-change（侧栏开合 / popout 开关会重建标签容器）
	// ---------------------------------------------------------------------

	private registerLayoutChange(): void {
		if (this.layoutEventRef) return;
		this.layoutEventRef = this.app.workspace.on("layout-change", () => {
			if (!this.isEnabled()) return;
			// popout 开合会重建标签容器，重扫 + 重挂 observer（均幂等，重复安全）；
			// 右键走 workspace 事件，全窗口自动覆盖，无需在此补绑
			this.applyToAll();
			this.setupObservers();
		});
	}

	// ---------------------------------------------------------------------
	// 分配入口 ①：右键菜单（订阅未公开事件 leaf-menu，向原生菜单追加项）
	// ---------------------------------------------------------------------

	private registerContextMenu(): void {
		if (this.leafMenuEventRef) return;
		// catalyst 未公开事件：leaf 右键菜单打开时向原生 Menu 追加菜单项，
		// 原生项完整保留；workspace 事件全窗口生效（含 popout），无需逐 document 绑定
		this.leafMenuEventRef = this.app.workspace.on(
			"leaf-menu",
			(menu: Menu, leaf: WorkspaceLeaf) => {
				if (!this.isEnabled()) return;
				// 标签页 data-type 即 leaf 的视图类型（非本地化机器标识）
				const dataType = leaf.view?.getViewType();
				if (!dataType) return;

				menu.addItem((item) =>
					item
						.setTitle(LL.settings.tabHeader.menu.setIcon())
						.setIcon("image")
						.onClick(() =>
							this.openIconPickerFor(dataType, leaf.tabHeaderEl),
						),
				);
				if (this.settings?.data?.[dataType]?.icon) {
					menu.addItem((item) =>
						item
							.setTitle(LL.settings.tabHeader.menu.resetIcon())
							.setIcon("rotate-ccw")
							.onClick(() => void this.writeOverride(dataType)),
					);
				}
			},
		);
	}

	private openIconPickerFor(dataType: string, sourceEl?: HTMLElement): void {
		const current = this.settings?.data?.[dataType];
		// sourceEl（leaf.tabHeaderEl）的 ownerDocument 保证 popout 下弹窗挂对窗口
		const modal = new IconSelector(
			this.app,
			this.buildIconItems(),
			current?.type ?? "lucide",
			current?.color,
			(icon, type) =>
				void this.writeOverride(dataType, {
					id: dataType,
					icon,
					type,
					color: current?.color ?? "",
				}),
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
	// 设置写入（整 map 写入，与 Ribbon/文件浏览器保持一致，规避未来含点类型）
	// ---------------------------------------------------------------------

	private async writeOverride(
		dataType: string,
		next?: ITabHeaderIconOverride,
	): Promise<void> {
		const nextMap = { ...(this.settings?.data ?? {}) };
		if (next) {
			nextMap[dataType] = next;
		} else {
			delete nextMap[dataType];
		}
		await this.plugin.settingsStore.updateSettingByPath(
			"tabHeader.data",
			nextMap,
		);
	}
}
