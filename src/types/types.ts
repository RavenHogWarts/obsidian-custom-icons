export interface IPluginSettings {
	communityPlugins: {
		enable: boolean;
		enableSearchResults: boolean;
		default: ICommunityPluginIcon;
		data: Record<string, ICommunityPluginIconOverride>;
	};
	// Ribbon 按钮（左侧 .side-dock-actions），以 aria-label 为映射键
	ribbon: {
		enable: boolean;
		data: Record<string, IRibbonIconOverride>;
	};
	// 文件浏览器（data-type="file-explorer"）文件夹/文件图标
	fileExplorer: {
		enable: boolean;
		/** 所有文件夹的统一默认图标；icon 为空 = 文件夹不显示图标 */
		folderDefault: IIcon;
		/** 单个文件夹覆盖，key = data-path（如 "Components/basic"） */
		folders: Record<string, IFileExplorerIconOverride>;
		/** 所有文件的兜底默认；icon 为空 = 未匹配扩展名的文件不显示图标 */
		fileDefault: IIcon;
		/** 按扩展名的默认，key = 小写去点扩展名（如 "md"、"pdf"、"canvas"） */
		extensions: Record<string, IFileExplorerIconOverride>;
		/** 单个文件覆盖，key = data-path（如 "YG/春节.md"） */
		files: Record<string, IFileExplorerIconOverride>;
		/** 继承开关：子文件夹 / 子文件 在无自身配置时继承最近祖先文件夹图标（默认关） */
		inherit: { subfolder: boolean; file: boolean };
	};
	// 标签页头（.workspace-tab-header[data-type]），两级解析：单标签 > 按视图类型
	tabHeader: {
		enable: boolean;
		/** 按视图类型覆盖（兜底层），key = data-type（如 "file-explorer"、"search"） */
		data: Record<string, ITabHeaderIconOverride>;
		/** 单标签覆盖（优先层），key = `${data-type}::${aria-label}`（如 "markdown::春节.md"） */
		tabs: Record<string, ITabHeaderIconOverride>;
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
export interface IFileExplorerIconOverride {
	/** = data-path 或 扩展名，冗余存储便于归一化 */
	id: string;
	icon?: string;
	type?: IconType;
	color?: string;
}
export interface ITabHeaderIconOverride {
	/**
	 * 冗余存储便于归一化：类型层 = data-type；单标签层 = `${data-type}::${aria-label}`
	 * （data-type 为机器标识不含 `:`，解析取首个 `::`，标签名自身含 `::` 也不歧义）
	 */
	id: string;
	icon?: string;
	type?: IconType;
	color?: string;
}

// Definition
export interface IIcon {
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
	fileExplorer: {
		enable: false,
		folderDefault: { id: "", icon: "", type: "lucide", color: "" },
		folders: {},
		fileDefault: { id: "", icon: "", type: "lucide", color: "" },
		extensions: {},
		files: {},
		inherit: { subfolder: false, file: false },
	},
	tabHeader: {
		enable: false,
		data: {},
		tabs: {},
	},
	experimental: {
		keepPluginFirst: false,
	},
	customIconLib: {
		svg: [],
		packs: {},
	},
};
