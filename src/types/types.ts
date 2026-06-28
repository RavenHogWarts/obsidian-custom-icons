export interface IPluginSettings {
	communityPlugins: {
		enable: boolean;
		enableSearchResults: boolean;
		default: ICommunityPluginIcon;
		data: Record<string, ICommunityPluginIconOverride>;
	};
	// 扩展示例：侧边栏视图图标
	// sidebarViews: {
	// 	enable: boolean;
	// 	data: Record<string, IViewIcon>;
	// };
	// 扩展示例：文件浏览器图标
	// fileExplorer: {
	// 	enable: boolean;
	// 	folderIcons: Record<string, IFolderIcon>;
	// 	fileIcons: Record<string, IFileIcon>;
	// };
	customIconLib: ICustomIconLib;
}

// Reference
export interface ICommunityPluginIcon extends IIcon {}
export interface ICommunityPluginIconOverride {
	id: string;
	icon?: string;
	type?: IconType;
	color?: string;
}

// Definition
interface IIcon {
	id: string;
	icon: string;
	type: IconType;
	color?: string;
}

export type IconType = "lucide" | "svg";

// Library
export interface ICustomIconLib {
	svg: ICustomSVGIcon[];
}

// Definition
export interface ICustomSVGIcon {
	id: string;
	content: string;
}

export const DEFAULT_SETTINGS: IPluginSettings = {
	communityPlugins: {
		enable: false,
		enableSearchResults: false,
		default: { id: "", icon: "puzzle", type: "lucide", color: "" },
		data: {},
	},
	customIconLib: {
		svg: [],
	},
};
