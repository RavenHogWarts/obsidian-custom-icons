import IconPackService from "@src/service/icon-packs/IconPackService";
import IconPackStore from "@src/service/icon-packs/IconPackStore";
import "@styles/fix.css";
import { Notice, Plugin } from "obsidian";
import { LL } from "./i18n/i18n";
import CommunityPluginIconHandler from "./service/CommunityPluginIconHandler";
import CustomIconLibHandler from "./service/CustomIconLibHandler";
import FileExplorerIconHandler from "./service/FileExplorerIconHandler";
import KeepPluginFirstHandler from "./service/KeepPluginFirstHandler";
import RibbonIconHandler from "./service/RibbonIconHandler";
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

	async onload() {
		this.registerIconHandlers();

		// loadSettings 内部会触发 saveSettings → applyAll，
		// 图标库在此完成首次注册（早于 onLayoutReady）
		await this.settingsStore.loadSettings();

		// 预载图标库包文件进内存缓存后重新应用，
		// 保证包图标在 onLayoutReady 前完成注册（保持提供方最先契约）
		await this.iconPackStore.preload(this.settings.customIconLib.packs);
		this.iconManager.applyAll();

		this.registerLeafViews();
		this.registerCommands();
		this.registerRibbonCommands();

		this.app.workspace.onLayoutReady(() => {
			this.iconManager.applyAll();
		});

		this.addSettingTab(new PluginSettingTab(this));
	}

	onunload() {
		this.iconManager.cleanupAll();
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// 更新设置并重新应用所有图标
		this.iconManager.updateSettings(this.settings);
		this.iconManager.applyAll();
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
		this.iconManager.registerHandler(
			new CustomIconLibHandler(this.iconPackStore),
		);
		this.iconManager.registerHandler(new CommunityPluginIconHandler());
		this.iconManager.registerHandler(new RibbonIconHandler());
		this.iconManager.registerHandler(new FileExplorerIconHandler(this));
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
