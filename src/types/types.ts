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
	// Ribbon 按钮（左侧 .side-dock-actions），以 aria-label 为映射键
	ribbon: {
		enable: boolean;
		data: Record<string, IRibbonIconOverride>;
	};
	// 实验性功能
	experimental: {
		keepPluginFirst: boolean;
	};
	customIconLib: ICustomIconLib;
}

// Reference
export type ICommunityPluginIcon = IIcon;
export interface ICommunityPluginIconOverride {
	id: string;
	icon?: string;
	type?: IconType;
	color?: string;
}
export interface IRibbonIconOverride {
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
	/** 已安装图标库的 manifest（仅元数据，图标内容存插件目录 icon-packs/ 文件） */
	packs: Record<string, IIconPackManifest>;
}

// Definition
export interface ICustomSVGIcon {
	id: string;
	content: string;
}

/** 图标库数据源配置（安装时快照，重装/更新时复用） */
export type IconSourceConfig =
	| {
			type: "iconify";
			/** Iconify 图标集前缀，如 "fa6"、"tabler" */
			prefix: string;
	  }
	| {
			type: "npm-svg";
			/** npm 包名，如 "@fortawesome/fontawesome-free" */
			package: string;
			/** 固定版本（安装时解析快照） */
			version: string;
			/** SVG 文件路径 glob，如 "svgs/{solid,regular,brands}/*.svg" */
			glob: string;
	  };

/** data.json 中每个图标库的 manifest 条目（不含图标内容） */
export interface IIconPackManifest {
	/** 包 id，同时是图标命名空间：注册 id = CI-{packId}-{name} */
	id: string;
	name: string;
	version?: string;
	license?: string;
	iconCount: number;
	enabled: boolean;
	installedAt: number;
	source: IconSourceConfig;
}

export const DEFAULT_SETTINGS: IPluginSettings = {
	communityPlugins: {
		enable: false,
		enableSearchResults: false,
		default: { id: "", icon: "puzzle", type: "lucide", color: "" },
		data: {},
	},
	ribbon: {
		enable: false,
		data: {},
	},
	experimental: {
		keepPluginFirst: false,
	},
	customIconLib: {
		svg: [],
		packs: {},
	},
};
