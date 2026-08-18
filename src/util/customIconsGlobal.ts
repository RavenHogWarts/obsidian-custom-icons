import { getIcon, getIconIds } from "obsidian";

/** 库图标在 Obsidian 全局图标注册表中的统一前缀 */
export const CI_PREFIX = "CI-";

/** 库图标 id（不含前缀）转全局图标 id */
export function toGlobalIconId(id: string): string {
	return id.startsWith(CI_PREFIX) ? id : `${CI_PREFIX}${id}`;
}

/**
 * 图标库变更事件：每次库图标重注册（插件加载、增删改、手动重应用）后派发。
 * 合作式消费方可监听此事件，在收到后重新渲染自己的图标，
 * 从而免疫"消费方先渲染、本插件后注册"的加载顺序问题。
 * 详见 dev/260818/图标注册时机分析与解决方案.md 方案 B。
 */
export const CUSTOM_ICONS_CHANGED_EVENT = "custom-icons:changed";

export interface CustomIconsChangedDetail {
	/** 本次注册后可用的全部库图标 id（不含 CI- 前缀，全局 id 为 `CI-` + id） */
	ids: string[];
}

export function dispatchCustomIconsChanged(ids: string[]): void {
	// 事件总线固定派发到主窗口 document：若用 activeDocument，
	// popout 窗口聚焦时会派发到 popout 文档，主窗口上的监听者将收不到事件
	// eslint-disable-next-line obsidianmd/prefer-active-doc
	document.dispatchEvent(
		new CustomEvent<CustomIconsChangedDetail>(CUSTOM_ICONS_CHANGED_EVENT, {
			detail: { ids },
		}),
	);
}

/**
 * 暴露给其他插件的稳定全局 API。
 * 消费方接入范式：
 * ```ts
 * const renderIcon = () => setIcon(this.iconEl, "CI-foo");
 * renderIcon(); // 已注册则直接成功
 * document.addEventListener("custom-icons:changed", renderIcon);
 * ```
 */
export interface CustomIconsGlobalApi {
	/** 图标是否已注册（id 自动补 CI- 前缀） */
	hasIcon: (id: string) => boolean;
	/** 全部库图标 id（不含 CI- 前缀） */
	getIconIds: () => string[];
	/** 等待某个图标就绪；超时返回 false。用于消费方 onload 阶段的早期渲染 */
	waitForIcon: (id: string, timeoutMs?: number) => Promise<boolean>;
}

declare global {
	interface Window {
		customIcons?: CustomIconsGlobalApi;
	}
}

/** 在插件加载时安装（需早于首次图标注册，见 main.ts） */
export function installCustomIconsGlobal(): void {
	window.customIcons = {
		hasIcon: (id) => getIcon(toGlobalIconId(id)) !== null,
		getIconIds: () =>
			getIconIds()
				.filter((iconId) => iconId.startsWith(CI_PREFIX))
				.map((iconId) => iconId.slice(CI_PREFIX.length)),
		waitForIcon: (id, timeoutMs = 5000) =>
			new Promise((resolve) => {
				const globalId = toGlobalIconId(id);
				if (getIcon(globalId)) {
					resolve(true);
					return;
				}
				const startedAt = Date.now();
				const timer = window.setInterval(() => {
					if (getIcon(globalId)) {
						window.clearInterval(timer);
						resolve(true);
					} else if (Date.now() - startedAt > timeoutMs) {
						window.clearInterval(timer);
						resolve(false);
					}
				}, 100);
			}),
	};
}

/** 在插件卸载时移除 */
export function removeCustomIconsGlobal(): void {
	window.customIcons = undefined;
}
