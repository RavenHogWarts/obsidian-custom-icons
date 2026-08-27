import { createCustomIconsApi } from "@src/api/CustomIconsApi";
import {
	CUSTOM_ICONS_CHANGED,
	type CustomIconsApi,
} from "@src/api/types";
import IconPackService from "@src/service/icon-packs/IconPackService";
import IconPackStore from "@src/service/icon-packs/IconPackStore";
import "@styles/fix.css";
import { Notice, Plugin } from "obsidian";
import { LL } from "./i18n/i18n";
import CommunityPluginIconHandler from "./service/CommunityPluginIconHandler";
import CustomIconLibHandler from "./service/CustomIconLibHandler";
import BookmarksIconHandler from "./service/BookmarksIconHandler";
import FileExplorerIconHandler from "./service/FileExplorerIconHandler";
import KeepPluginFirstHandler from "./service/KeepPluginFirstHandler";
import RibbonIconHandler from "./service/RibbonIconHandler";
import TabHeaderIconHandler from "./service/TabHeaderIconHandler";
import { PluginSettingTab } from "./settings/PluginSettingTab";
import SettingsStore from "./settings/SettingsStore";
import { IPluginSettings } from "./types/types";
import IconManager from "./util/IconManager";
import openPluginView from "./util/openPluginView";
import {
	CustomIconLibView,
	VIEW_TYPE_CUSTOM_ICON_LIB,
} from "./views/CustomIconLibView";

export default class CIPlugin extends Plugin {
	settings: IPluginSettings;
	readonly settingsStore = new SettingsStore(this);
	readonly iconManager = new IconManager(this.app);
	/** 图标库文件存储（插件目录 icon-packs/，全程本地、离线可用） */
	readonly iconPackStore = new IconPackStore(
		this.app.vault.adapter,
		`${this.manifest.dir}/icon-packs`,
	);
	/** 图标库安装/卸载编排（网络只出现在显式安装/更新动作中） */
	readonly iconPackService = new IconPackService(this);

	/**
	 * 注册方处理器，直接持有引用。
	 *
	 * 不走 `iconManager.getHandler()` 取：那里返回的是 `IIconHandler<T>` 接口，
	 * 而 `getRevision()` 是本处理器的实现细节，不该为了一个内部字段去放宽接口
	 * 或在调用点做类型窄化。
	 */
	private readonly iconLibHandler = new CustomIconLibHandler(
		this.iconPackStore,
	);

	/**
	 * 跨插件 API（见 dev/ecosystem/跨插件API导出方案.md）。
	 *
	 * 挂在插件实例上而**不是** `window`：消费方经 `app.plugins.getPlugin(id)` 取用，
	 * 配 `app.workspace.trigger` 广播变更，监听者可用 `registerEvent` 自动回收。
	 * 2026-08-19 移除的那套 `window.customIcons` + `document.dispatchEvent` 不要退回。
	 *
	 * 常驻、无开关：一个「可能被关掉」的 API 比没有 API 更糟，消费方还得为两种
	 * 世界各写一遍。没有消费方时它一行都不跑。
	 */
	readonly api: CustomIconsApi = createCustomIconsApi(this);

	/** 上次广播时的图标修订号，用于给无关设置改动去抖（见 §5） */
	#broadcastRevision = 0;

	async onload() {
		this.registerIconHandlers();

		// loadSettings 内部会触发 saveSettings → applyAll，
		// 图标库在此完成首次注册（早于 onLayoutReady）
		await this.settingsStore.loadSettings();

		// 预载图标库包文件进内存缓存后重新应用，
		// 保证包图标在 onLayoutReady 前完成注册（保持提供方最先契约）
		await this.iconPackStore.preload(this.settings.customIconLib.packs);
		this.iconManager.applyAll();
		// 预载后包图标才真正进注册表：此时广播，早于 onLayoutReady，
		// 保证「提供方最先」对消费方同样成立
		this.notifyIconsChanged();

		this.registerLeafViews();
		this.registerCommands();
		this.registerRibbonCommands();

		this.app.workspace.onLayoutReady(() => {
			this.iconManager.applyAll();
		});

		this.addSettingTab(new PluginSettingTab(this));
	}

	onunload() {
		// cleanupAll 会 removeIcon 清空注册表：**必须广播**，否则消费方在本插件
		// 被禁用后仍以为那些 id 有效，resolve 成功而画不出东西（方案 §1.1 的空白路径）
		this.iconManager.cleanupAll();
		this.notifyIconsChanged({ force: true });
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// 更新设置并重新应用所有图标
		this.iconManager.updateSettings(this.settings);
		this.iconManager.applyAll();
		// 咽喉点：装包 / 卸包 / 启停包 / 增删改 SVG / 导入库 / 清理死键都经过这里。
		// 受 revision 去抖，无关设置改动（如切 fileExplorer 开关）不会惊动消费方
		this.notifyIconsChanged();
	}

	/**
	 * 广播图标集合变更（见 dev/ecosystem/跨插件API导出方案.md §5）。
	 *
	 * **必须在 `applyAll()` 之后调用**：监听者一进来就该看到新的注册表。
	 *
	 * @param force 跳过 revision 去抖。用于 `reapply-icons`（用户按它就是因为哪里
	 *   不对了，此时去抖是帮倒忙）与 `onunload`（注册表已清空，但 handler 实例
	 *   连同它的 revision 一起没了，无从比较）。
	 */
	private notifyIconsChanged(options?: { force: boolean }): void {
		const revision = this.iconRevision;
		if (!options?.force && revision === this.#broadcastRevision) {
			return;
		}
		this.#broadcastRevision = revision;
		this.app.workspace.trigger(CUSTOM_ICONS_CHANGED, { revision });
	}

	/** 当前图标修订号，由注册方自报 */
	get iconRevision(): number {
		return this.iconLibHandler.getRevision();
	}

	private registerLeafViews() {
		this.registerView(
			VIEW_TYPE_CUSTOM_ICON_LIB,
			(leaf) => new CustomIconLibView(leaf, this),
		);
	}

	private registerCommands() {
		this.addCommand({
			id: "open-icon-library",
			name: LL.view.CustomIconLib.command(),
			callback: () => {
				void openPluginView(this.app, VIEW_TYPE_CUSTOM_ICON_LIB);
			},
		});

		this.addCommand({
			id: "reapply-icons",
			name: LL.view.CustomIconLib.reapplyCommand(),
			callback: () => {
				// 重新注册全部图标并重应用所有处理器管理的界面，
				// 用于界面图标异常时的快速自修复
				this.iconManager.applyAll();
				new Notice(LL.view.CustomIconLib.reapplyNotice());
			},
		});
	}

	private registerRibbonCommands() {
		this.addRibbonIcon(
			"book-image",
			LL.view.CustomIconLib.command(),
			() => {
				void openPluginView(this.app, VIEW_TYPE_CUSTOM_ICON_LIB);
			},
		);
	}

	/**
	 * 注册所有图标处理器
	 * 在这里添加新的处理器以扩展功能
	 */
	private registerIconHandlers() {
		// 契约：CustomIconLibHandler（提供方，向 Obsidian 全局注册表注册 CI- 图标）
		// 必须先于消费 CI- 图标的处理器注册——IconManager.applyAll() 按注册顺序执行。
		// 若消费方先 apply，在运行时重启插件（layout 已就绪）场景下，
		// 其 onLayoutReady 回调会同步执行，导致在库图标注册前渲染而空白。
		// 详见 dev/260818/handler顺序与重启空白修复.md
		this.iconManager.registerHandler(this.iconLibHandler);
		this.iconManager.registerHandler(new CommunityPluginIconHandler());
		this.iconManager.registerHandler(new RibbonIconHandler());
		this.iconManager.registerHandler(new FileExplorerIconHandler(this));
		this.iconManager.registerHandler(new TabHeaderIconHandler(this));
		this.iconManager.registerHandler(new BookmarksIconHandler(this));
		// 实验性功能（非图标处理器，仅复用生命周期编排）
		this.iconManager.registerHandler(
			new KeepPluginFirstHandler(this.manifest.id),
		);

		// 扩展示例：添加更多处理器
		// this.iconManager.registerHandler(new SidebarViewIconHandler());
	}

	// private manageLeaf(leaf: WorkspaceLeaf) {
	// 	const leafType = leaf.getViewState().type;
	// 	const leafContainerEl = leaf.view.containerEl;

	// 	switch (leafType) {
	// 		case "markdown":
	// 			break;
	// 		case "empty":
	// 			break;
	// 		case "file-explorer":
	// 			break;
	// 		case "search":
	// 			break;
	// 		case "bookmarks":
	// 			break;
	// 		case "tag":
	// 			break;
	// 		case "outline":
	// 			break;
	// 		case "all-properties":
	// 			break;
	// 		case "file-properties":
	// 			break;
	// 		case "outgoing-link":
	// 			break;
	// 		case "backlink":
	// 			break;
	// 		case "footnotes":
	// 			break;
	// 		default:
	// 			break;
	// 	}
	// }
}
