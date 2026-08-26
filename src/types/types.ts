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
	// 书签面板（data-type="bookmarks"），两级解析：单项覆盖 > 按书签类型
	bookmarks: {
		enable: boolean;
		/** 单项覆盖（优先层），key = String(ctime)（书签稳定 id，重命名/移动不失效） */
		items: Record<string, IBookmarkIconOverride>;
		/** 类型默认层（兜底），key = BookmarkKind（file/folder/group/search/graph/url） */
		types: Record<string, IBookmarkIconOverride>;
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
	/**
	 * 所属分组，**仅 `extensions` 一表有意义**（`folders` / `files` 归一化时剥掉——
	 * 那两表天生有继承 `inherit.subfolder` / `inherit.file`，那就是路径版的「一起设置」）。
	 *
	 * 缺失 / 空串 = 未分组。组名即身份且**区分大小写**，没有独立分组注册表——
	 * 因此空组不存在，改组名 = 改写全部成员的该字段（一次整 map 写入）。
	 *
	 * 「一起设置图标」在**写入侧**实现（`setGroupIcon` 把图标扇出到全部成员），
	 * 解析层因此完全不知道分组的存在：`resolveFileIcon` 仍是两级 O(1) 查表，
	 * 不存在「单条规则 vs 分组规则谁优先」这个问题。代价是组的图标不是单一真相
	 * ——用户单独改过某个成员后组进入「混合」态，界面如实显示而不隐藏。
	 * 详见 dev/260826/文件浏览器扩展名分组与同类设置UX方案.md §3.2。
	 */
	group?: string;
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

/** 书签类型（对应 Obsidian BookmarkItem.type） */
export type BookmarkKind =
	| "file"
	| "folder"
	| "group"
	| "search"
	| "graph"
	| "url";

export interface IBookmarkIconOverride {
	/** 冗余存储便于归一化：单项层 = String(ctime)；类型层 = BookmarkKind */
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
	/**
	 * 最近使用（新→旧），元素为 `${type}:${id}` 复合键。
	 *
	 * 用复合键而非裸 id：`lucide` 与 `svg` 是两个命名空间，可能撞名
	 * （`svg` 侧还混了用户裸 id 与 `CI-{packId}-{name}` 两种形态）。
	 * 写入时去重并截断到 RECENT_LIMIT。
	 */
	recent: string[];
	/** 收藏（用户手动，保持添加顺序），元素同为 `${type}:${id}` */
	favorites: string[];
	/** 图标库视图偏好 */
	ui: ICustomIconLibUI;
}

/**
 * 图标库视图偏好。
 *
 * 这里的字面量联合与 `util/iconGridDensity.ts`（`IconGridDensity`）、
 * `components/icon-library/libNav.ts`（`LibTabId`）、`util/svgLibrary.ts`
 * （`SvgSortMode`）各自的命名类型同构——types.ts 不向 util / components 反向
 * 依赖，故在此重复声明；两端由 `normalize*` 函数在读取时对齐。
 */
export interface ICustomIconLibUI {
	/** 网格密度：紧凑 / 标准 / 大（见 util/iconGridDensity.ts） */
	density: "compact" | "normal" | "large";
	/** 上次停留的页签，重开视图时回到这里（见 components/icon-library/libNav.ts） */
	lastTab: "all" | "pack" | "svg" | "lucide";
	/** 「我的 SVG」页的排序方式（见 util/svgLibrary.ts） */
	svgSort: "name-asc" | "name-desc" | "added-desc";
	/**
	 * 「我的 SVG」页的分组筛选：`""` = 全部，其余 = 组名（见 util/svgGroups.ts）。
	 *
	 * 「仅未分组」这一档不落盘（重开视图回到全部）：`mergeWithDefaults` 按 `typeof`
	 * 比对，默认值写成 `null` 会让已存的字符串被丢弃，于是三个筛选态只能压进一个
	 * 字符串；而组名允许任意字符，再造哨兵值总有相撞的余地。
	 */
	svgGroup: string;
}

/** 「最近使用」保留条数上限 */
export const RECENT_LIMIT = 40;

// Definition
export interface ICustomSVGIcon {
	id: string;
	content: string;
	/**
	 * 添加时间戳，用于「最近添加」排序。
	 * 旧数据没有这个字段，排序时按数组顺序（= 插入顺序）兜底，无需迁移。
	 */
	addedAt?: number;
	/**
	 * 所属分组（用户自己划的一套图标），用于「我的 SVG」页内筛选。
	 *
	 * 缺失 / 空串 = 未分组。组名即身份且**区分大小写**（`Weather` 与 `weather`
	 * 是两个组），重命名等于改写全部成员的该字段——本方案不设独立分组注册表，
	 * 组名的唯一真相就是成员身上的这个值，因此空组不存在。
	 *
	 * **永不参与注册 id 构成**：id 是 `addIcon` 的注册键，又被 fileExplorer /
	 * bookmarks / ribbon / tabHeader / communityPlugins 五张覆盖表引用，改 id
	 * 会打断用户已配好的图标（详见 dev/260825/自定义SVG分组方案.md §2.2）。
	 * 也因此改组不会让收藏 / 最近失效（那两份存 `${type}:${id}`）。
	 */
	group?: string;
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
	bookmarks: {
		enable: false,
		items: {},
		types: {},
	},
	experimental: {
		keepPluginFirst: false,
	},
	customIconLib: {
		svg: [],
		packs: {},
		recent: [],
		favorites: [],
		ui: {
			density: "normal",
			lastTab: "all",
			svgSort: "name-asc",
			svgGroup: "",
		},
	},
};
