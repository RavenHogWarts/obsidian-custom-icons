import {
	ICommunityPluginIcon,
	ICommunityPluginIconOverride,
} from "@src/types/types";
import { AbstractIconHandler } from "@src/util/IconHandler";
import { resolveCommunityPluginIcon } from "@src/util/communityPluginIcon";
import { createIconRenderable } from "@src/util/createIconRenderable";
import { type IconRenderable } from "@src/util/iconRenderable";
import setIcon from "@src/util/setIcon";

interface ICommunityPluginConfig {
	enable: boolean;
	enableSearchResults: boolean;
	default: ICommunityPluginIcon;
	data: Record<string, ICommunityPluginIconOverride>;
}

/**
 * 社区插件图标处理器
 * 负责替换社区插件设置页面中的插件图标
 */
export default class CommunityPluginIconHandler extends AbstractIconHandler<ICommunityPluginConfig> {
	readonly id = "communityPlugins";
	private readonly pluginListContainerClassName =
		"custom-icon-community-plugins";
	private readonly searchResultsContainerClassName =
		"custom-icon-community-plugin-search-results";
	private readonly pluginListItemClassName =
		"custom-icon-community-plugin-item";
	private readonly searchResultItemClassName =
		"custom-icon-community-plugin-search-result-item";
	private readonly pluginNavItemSelector =
		".vertical-tab-nav-item[data-setting-id]";
	private readonly searchResultItemSelector = ".setting-search-result-tab";
	private readonly searchResultCleanupSelector =
		".setting-search-result-tab, .setting-search-result-group-items .setting-search-result-item";

	private mutationObserver: MutationObserver | null = null;

	apply(): void {
		if (!this.isEnabled()) {
			this.cleanup();
			return;
		}

		// 等待布局准备好
		this.app.workspace.onLayoutReady(() => {
			if (this.isPluginListEnabled()) {
				this.addPluginListContainerClassName();
			} else {
				this.removePluginListContainerClassName();
				this.removePluginListIcons();
			}

			if (this.isSearchResultsEnabled()) {
				this.addSearchResultsContainerClassName();
			} else {
				this.removeSearchResultsContainerClassName();
				this.removeSearchResultIcons();
			}

			this.applyIconsToExistingPlugins();
			this.setupMutationObserver();
		});
	}

	cleanup(): void {
		if (this.mutationObserver) {
			this.mutationObserver.disconnect();
			this.mutationObserver = null;
		}

		// 移除容器类名
		this.removePluginListContainerClassName();
		this.removeSearchResultsContainerClassName();

		// 移除所有自定义图标
		this.removeCustomIcons();
	}

	isEnabled(): boolean {
		return this.isPluginListEnabled() || this.isSearchResultsEnabled();
	}

	private isPluginListEnabled(): boolean {
		return this.settings?.enable ?? false;
	}

	private isSearchResultsEnabled(): boolean {
		return this.settings?.enableSearchResults ?? false;
	}

	/**
	 * 为容器添加自定义类名
	 */
	private addPluginListContainerClassName(): void {
		const container = this.app.setting?.communityPluginTabContainer;

		if (container) {
			container.classList.add(this.pluginListContainerClassName);
		}
	}

	/**
	 * 移除容器的自定义类名
	 */
	private removePluginListContainerClassName(): void {
		const container = this.app.setting?.communityPluginTabContainer;
		if (container) {
			container.classList.remove(this.pluginListContainerClassName);
		}
	}

	private addSearchResultsContainerClassName(): void {
		const container = this.app.setting?.tabHeadersEl;

		if (container) {
			container.classList.add(this.searchResultsContainerClassName);
		}
	}

	private removeSearchResultsContainerClassName(): void {
		const container = this.app.setting?.tabHeadersEl;
		if (container) {
			container.classList.remove(this.searchResultsContainerClassName);
		}
	}

	/**
	 * 为已存在的插件项添加图标
	 */
	private applyIconsToExistingPlugins(): void {
		if (this.isPluginListEnabled()) {
			const pluginListContainer =
				this.app.setting?.communityPluginTabContainer;
			if (pluginListContainer) {
				this.applyPluginListIconsInContainer(pluginListContainer);
			}
		}

		if (this.isSearchResultsEnabled()) {
			const searchContainer = this.app.setting?.tabHeadersEl;
			if (searchContainer) {
				this.applySearchResultIconsInContainer(searchContainer);
			}
		}
	}

	private applyPluginListIconsInContainer(
		container: ParentNode,
		// 一轮 sweep 建一个（见 util/iconRenderable.ts）。由调用方传入时复用同一个：
		// applyIconsForElementTree 会连调四处，各建一个等于把注册表 Set 建四遍
		canRender: IconRenderable = createIconRenderable(),
	): void {
		const pluginNavItems = container.querySelectorAll<HTMLElement>(
			this.pluginNavItemSelector,
		);

		pluginNavItems.forEach((navItemEl) => {
			this.applyIconToNavItem(navItemEl, canRender);
		});
	}

	private applySearchResultIconsInContainer(
		container: ParentNode,
		canRender: IconRenderable = createIconRenderable(),
	): void {
		const searchResultItems = container.querySelectorAll<HTMLElement>(
			this.searchResultItemSelector,
		);

		searchResultItems.forEach((resultEl) => {
			this.applyIconToSearchResult(resultEl, canRender);
		});
	}

	/**
	 * 为单个导航项应用图标
	 */
	private applyIconToNavItem(
		navItemEl: HTMLElement,
		canRender: IconRenderable = createIconRenderable(),
	): void {
		if (!this.isPluginListEnabled()) return;

		const pluginId = navItemEl.getAttribute("data-setting-id");
		if (!pluginId) return;

		const iconConfig = resolveCommunityPluginIcon(
			pluginId,
			this.settings.default,
			this.settings.data[pluginId],
			canRender,
		);

		this.addIconToPluginNavItem(navItemEl, iconConfig);
	}

	private applyIconToSearchResult(
		resultEl: HTMLElement,
		canRender: IconRenderable = createIconRenderable(),
	): void {
		if (!this.isSearchResultsEnabled()) return;

		const pluginId = this.resolvePluginIdFromSearchResult(resultEl);
		if (!pluginId) return;

		const iconConfig = resolveCommunityPluginIcon(
			pluginId,
			this.settings.default,
			this.settings.data[pluginId],
			canRender,
		);

		this.addIconToPluginNavItem(resultEl, iconConfig);
	}

	private resolvePluginIdFromSearchResult(
		resultEl: HTMLElement,
	): string | null {
		const pluginId = resultEl.getAttribute("data-setting-id");
		if (pluginId) return pluginId;

		const labelEl = resultEl.querySelector(
			".setting-search-result-tab-label, .vertical-tab-nav-item-title",
		);
		const pluginName = labelEl?.textContent?.replace(/\s+/g, " ").trim();
		if (!pluginName) return null;

		const matches = Object.entries(this.app.plugins.manifests).filter(
			([, manifest]) => manifest.name === pluginName,
		);

		if (matches.length !== 1) {
			return null;
		}

		return matches[0][0];
	}

	private addIconToPluginNavItem(
		navItemEl: HTMLElement,
		communityPlugin: ICommunityPluginIcon,
	) {
		this.addItemClassName(navItemEl);

		// 检查是否存在原生图标（没有 custom-icon 类的）
		const nativeIcon = navItemEl.querySelector(
			".vertical-tab-nav-item-icon:not(.custom-icon)",
		);
		if (nativeIcon) return; // 如果是原生图标，不做修改

		// 查找或创建自定义图标容器
		let iconContainer = navItemEl.querySelector(
			".vertical-tab-nav-item-icon.custom-icon",
		) as HTMLElement;

		if (!iconContainer) {
			// 如果不存在自定义图标容器，创建一个
			iconContainer = navItemEl.createDiv({
				cls: ["vertical-tab-nav-item-icon", "custom-icon"],
			});

			const firstChild = navItemEl.children[0];
			if (firstChild) {
				navItemEl.insertBefore(iconContainer, firstChild);
			} else {
				navItemEl.appendChild(iconContainer);
			}
		} else {
			// 检查图标是否需要更新（通过数据属性）
			const currentType = iconContainer.getAttribute("data-icon-type");
			const currentIcon = iconContainer.getAttribute("data-icon-name");
			const currentColor = iconContainer.getAttribute("data-icon-color");

			if (
				currentType === communityPlugin.type &&
				currentIcon === communityPlugin.icon &&
				currentColor === (communityPlugin.color || "")
			) {
				return; // 图标没有变化，跳过更新
			}
		}

		// 更新图标（无论是新创建的还是已存在但需要更新的）
		setIcon(iconContainer, communityPlugin.type, communityPlugin.icon, {
			color: communityPlugin.color,
		});

		// 仅当实际渲染出图标时记录 data-icon-* 属性；
		// 渲染失败（如库图标尚未注册）时不记录，
		// 让下一轮 apply 重试而非跳过（避免空白固化）
		if (iconContainer.querySelector("svg")) {
			iconContainer.setAttribute("data-icon-type", communityPlugin.type);
			iconContainer.setAttribute("data-icon-name", communityPlugin.icon);
			iconContainer.setAttribute(
				"data-icon-color",
				communityPlugin.color || "",
			);
		}
	}

	/**
	 * 设置 MutationObserver 监听新添加的插件项
	 */
	private setupMutationObserver(): void {
		// 如果已存在，先清理
		if (this.mutationObserver) {
			this.mutationObserver.disconnect();
		}

		const observedContainers = this.getObservedContainers();

		if (observedContainers.length === 0) {
			return;
		}

		this.mutationObserver = new MutationObserver((mutations) => {
			// 在回调中再次检查是否启用，防止在禁用后仍然执行
			if (!this.isEnabled()) {
				return;
			}

			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					if (!node.instanceOf(HTMLElement)) return;

					this.applyIconsForElementTree(node);
				});
			});
		});

		observedContainers.forEach((container) => {
			this.mutationObserver?.observe(container, {
				childList: true,
				subtree: true,
			});
		});
	}

	private applyIconsForElementTree(rootEl: HTMLElement): void {
		// 一次建好往下传：这里最多要走四条应用路径，各自默认建一个的话，
		// 一次 observer 回调就会把注册表快照建四遍（装了大包时是四份上万条的 Set）
		const canRender = createIconRenderable();

		if (
			this.isPluginListEnabled() &&
			rootEl.matches(this.pluginNavItemSelector)
		) {
			this.applyIconToNavItem(rootEl, canRender);
		}

		if (
			this.isSearchResultsEnabled() &&
			rootEl.matches(this.searchResultItemSelector)
		) {
			this.applyIconToSearchResult(rootEl, canRender);
		}

		if (this.isPluginListEnabled()) {
			this.applyPluginListIconsInContainer(rootEl, canRender);
		}

		if (this.isSearchResultsEnabled()) {
			this.applySearchResultIconsInContainer(rootEl, canRender);
		}
	}

	private getObservedContainers(): HTMLElement[] {
		const containers = [
			this.isPluginListEnabled()
				? this.app.setting?.communityPluginTabContainer
				: null,
			this.isSearchResultsEnabled()
				? this.app.setting?.tabHeadersEl
				: null,
		].filter((container): container is HTMLElement => Boolean(container));

		return Array.from(new Set(containers));
	}

	/**
	 * 移除所有自定义图标
	 */
	private removeCustomIcons(): void {
		this.removePluginListIcons();
		this.removeSearchResultIcons();
	}

	private removePluginListIcons(): void {
		const container = this.app.setting?.communityPluginTabContainer;
		if (!container) return;

		this.removeCustomIconsFromContainer(
			container,
			this.pluginNavItemSelector,
		);
	}

	private removeSearchResultIcons(): void {
		const container = this.app.setting?.tabHeadersEl;
		if (!container) return;

		this.removeCustomIconsFromContainer(
			container,
			this.searchResultCleanupSelector,
		);
	}

	private removeCustomIconsFromContainer(
		container: ParentNode,
		itemSelector: string,
	): void {
		const items = container.querySelectorAll(itemSelector);
		items.forEach((item) => {
			if (item.instanceOf(HTMLElement)) {
				item.classList.remove(this.pluginListItemClassName);
				item.classList.remove(this.searchResultItemClassName);
			}

			const customIcons = item.querySelectorAll(
				".vertical-tab-nav-item-icon.custom-icon",
			);
			customIcons.forEach((icon) => icon.remove());
		});
	}

	private addItemClassName(itemEl: HTMLElement): void {
		if (itemEl.matches(this.pluginNavItemSelector)) {
			itemEl.classList.add(this.pluginListItemClassName);
		}

		if (itemEl.matches(this.searchResultItemSelector)) {
			itemEl.classList.add(this.searchResultItemClassName);
		}
	}
}
