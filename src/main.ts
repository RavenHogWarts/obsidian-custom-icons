import "@styles/styles";
import { Notice, Plugin } from "obsidian";
import { LL } from "./i18n/i18n";
import CommunityPluginIconHandler from "./service/CommunityPluginIconHandler";
import CustomIconLibHandler from "./service/CustomIconLibHandler";
import RibbonIconHandler from "./service/RibbonIconHandler";
import { PluginSettingTab } from "./settings/PluginSettingTab";
import SettingsStore from "./settings/SettingsStore";
import { IPluginSettings } from "./types/types";
import IconManager from "./util/IconManager";
import {
	installCustomIconsGlobal,
	removeCustomIconsGlobal,
} from "./util/customIconsGlobal";
import openPluginView from "./util/openPluginView";
import {
	CustomIconLibView,
	VIEW_TYPE_CUSTOM_ICON_LIB,
} from "./views/CustomIconLibView";

export default class CIPlugin extends Plugin {
	settings: IPluginSettings;
	readonly settingsStore = new SettingsStore(this);
	readonly iconManager = new IconManager(this.app);

	async onload() {
		this.registerIconHandlers();

		// 全局 API 需先于首次图标注册安装，
		// 保证 custom-icons:changed 的监听者总能调用 window.customIcons
		installCustomIconsGlobal();

		// loadSettings 内部会触发 saveSettings → applyAll，
		// 图标库在此完成首次注册（早于 onLayoutReady）
		await this.settingsStore.loadSettings();

		this.registerLeafViews();
		this.registerCommands();
		this.registerRibbonCommands();

		this.app.workspace.onLayoutReady(() => {
			this.iconManager.applyAll();
		});

		this.addSettingTab(new PluginSettingTab(this));
	}

	onunload() {
		removeCustomIconsGlobal();
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
				openPluginView(this.app, VIEW_TYPE_CUSTOM_ICON_LIB);
			},
		});

		this.addCommand({
			id: "reapply-icons",
			name: LL.view.CustomIconLib.reapplyCommand(),
			callback: () => {
				// 重新注册全部图标并广播 custom-icons:changed，
				// 供合作式消费方与自身管辖区刷新；用于第三方界面空白时的用户自救
				this.iconManager.applyAll();
				new Notice(LL.view.CustomIconLib.reapplyNotice());
			},
		});
	}

	private registerRibbonCommands() {
		this.addRibbonIcon("library", LL.view.CustomIconLib.command(), () => {
			openPluginView(this.app, VIEW_TYPE_CUSTOM_ICON_LIB);
		});
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
		this.iconManager.registerHandler(new CustomIconLibHandler());
		this.iconManager.registerHandler(new CommunityPluginIconHandler());
		this.iconManager.registerHandler(new RibbonIconHandler());

		// 扩展示例：添加更多处理器
		// this.iconManager.registerHandler(new SidebarViewIconHandler());
		// this.iconManager.registerHandler(new FileExplorerIconHandler());
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
