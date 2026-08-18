import { IRibbonIconOverride } from "@src/types/types";
import { AbstractIconHandler } from "@src/util/IconHandler";
import setIcon, { cleanupIcon } from "@src/util/setIcon";

interface IRibbonConfig {
	enable: boolean;
	data: Record<string, IRibbonIconOverride>;
}

/**
 * Ribbon 图标处理器
 * 为左侧 Ribbon 按钮（.side-dock-actions .side-dock-ribbon-action）应用自定义图标。
 *
 * - 以 aria-label（= addRibbonIcon 的 title）作为映射键——DOM 上唯一的按钮标识
 * - 仅覆盖用户显式分配的按钮；分配被删除（重置）时还原原始图标
 * - 替换前快照原始状态（innerHTML + style 属性），禁用/卸载时完整还原
 * - 图标注册与 DOM 渲染同在本插件内，免疫跨插件加载顺序问题
 *
 * 实测结构（2026-08-18）：原生 ribbon 图标为 24×24；
 * 空白按钮可能残留 style="color: inherit;" 等内联样式，快照需一并保存。
 */
export default class RibbonIconHandler extends AbstractIconHandler<IRibbonConfig> {
	readonly id = "ribbon";

	private readonly containerSelector =
		".workspace-ribbon.mod-left .side-dock-actions";
	private readonly actionSelector = ".side-dock-ribbon-action";
	private readonly markerAttribute = "data-ci-ribbon";
	/** 原生 ribbon 图标为 24×24（区别于设置页的 16） */
	private readonly iconSize = 24;

	private mutationObserver: MutationObserver | null = null;
	/** 已替换按钮的原始状态快照（子节点克隆 + style），用于还原 */
	private snapshots = new WeakMap<
		HTMLElement,
		{ children: Node[]; style: string | null }
	>();

	apply(): void {
		if (!this.isEnabled()) {
			this.cleanup();
			return;
		}

		this.app.workspace.onLayoutReady(() => {
			this.applyToExistingActions();
			this.setupMutationObserver();
		});
	}

	cleanup(): void {
		if (this.mutationObserver) {
			this.mutationObserver.disconnect();
			this.mutationObserver = null;
		}
		this.restoreAll();
	}

	isEnabled(): boolean {
		return this.settings?.enable ?? false;
	}

	private getContainers(): HTMLElement[] {
		// ribbon 位于 workspace.containerEl 之外、仅存在于主窗口，
		// 因此直接查询主窗口 document
		// eslint-disable-next-line obsidianmd/prefer-active-doc
		const containers = document.querySelectorAll<HTMLElement>(
			this.containerSelector,
		);
		return Array.from(containers);
	}

	private applyToExistingActions(): void {
		this.getContainers().forEach((container) => {
			const actions = container.querySelectorAll<HTMLElement>(
				this.actionSelector,
			);
			actions.forEach((actionEl) => {
				this.applyToAction(actionEl);
			});
		});
	}

	private applyToAction(actionEl: HTMLElement): void {
		const label = actionEl.getAttribute("aria-label");
		if (!label) return;

		const override = this.settings?.data?.[label];

		// 未分配（含分配被删除/重置）：若此前被我们替换过，还原原始图标
		if (!override?.icon || !override.type) {
			if (actionEl.hasAttribute(this.markerAttribute)) {
				this.restoreAction(actionEl);
			}
			return;
		}

		const hadMarker = actionEl.hasAttribute(this.markerAttribute);
		if (!hadMarker) {
			// 首次替换前快照原始状态（子节点克隆 + 内联 style，可能残留消费方设置）
			this.snapshots.set(actionEl, {
				children: Array.from(actionEl.childNodes).map((child) =>
					child.cloneNode(true),
				),
				style: actionEl.getAttribute("style"),
			});
		}

		setIcon(actionEl, override.type, override.icon, {
			color: override.color,
			size: this.iconSize,
		});

		if (!actionEl.querySelector("svg")) {
			// 渲染失败（如库图标尚未注册）：还原原始图标，等待下一轮重试，
			// 避免把原有图标抹成空白（与 setIcon 的"失败不标记"语义一致）
			this.restoreAction(actionEl);
			return;
		}

		if (!hadMarker) {
			actionEl.setAttribute(this.markerAttribute, label);
		}
	}

	/**
	 * 监听新增按钮（后启用的插件在容器内追加 side-dock-ribbon-action）
	 * childList 即可：按钮是容器直接子节点，我们替换的是按钮内部 svg，不会自触发
	 */
	private setupMutationObserver(): void {
		this.mutationObserver?.disconnect();

		const containers = this.getContainers();
		if (containers.length === 0) {
			return;
		}

		this.mutationObserver = new MutationObserver((mutations) => {
			// 回调中再次检查启用状态，防止禁用后仍执行
			if (!this.isEnabled()) {
				return;
			}

			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					if (!node.instanceOf(HTMLElement)) return;
					if (node.matches(this.actionSelector)) {
						this.applyToAction(node);
					}
				});
			});
		});

		containers.forEach((container) => {
			this.mutationObserver?.observe(container, { childList: true });
		});
	}

	private restoreAction(actionEl: HTMLElement): void {
		const snapshot = this.snapshots.get(actionEl);
		if (snapshot) {
			// 同步清除 setIcon 的渲染状态缓存（WeakMap），
			// 否则"重置后再次分配同一图标"会被去重逻辑跳过而显示空白
			cleanupIcon(actionEl);
			actionEl.replaceChildren(...snapshot.children);
			if (snapshot.style === null) {
				actionEl.removeAttribute("style");
			} else {
				actionEl.setAttribute("style", snapshot.style);
			}
		}
		actionEl.removeAttribute(this.markerAttribute);
	}

	private restoreAll(): void {
		// eslint-disable-next-line obsidianmd/prefer-active-doc
		const markedActions = document.querySelectorAll(
			`[${this.markerAttribute}]`,
		);
		markedActions.forEach((el) => {
			if (el.instanceOf(HTMLElement)) {
				this.restoreAction(el);
			}
		});
	}
}
