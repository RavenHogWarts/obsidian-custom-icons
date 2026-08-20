import type { BaseTranslation } from "../i18n-types";

const zh = {
	settings: {
		communityPlugin: {
			name: "第三方插件",
			enable: {
				name: "启用功能",
				desc: "为没有图标的第三方插件设置添加图标",
			},
			searchResults: {
				name: "在搜索结果中显示图标",
				desc: "在设置搜索结果中显示插件图标（仅在 Obsidian 1.13.0+ 生效）",
			},
			default: {
				name: "默认图标",
				desc: "为没有图标的第三方插件设置添加默认图标",
				resetTooltip: "重置",
				dicesTooltip: "随机",
			},
			search: {
				placeholder: "输入插件名称...",
				noneFound: "未找到匹配的插件",
				resetTooltip: "重置所有为默认图标",
				dicesTooltip: "随机所有图标",
			},
			pluginList: {
				name: "插件列表",
				desc: "为没有图标的第三方插件添加自定义图标（修复 Obsidian v1.11.0）",
				resetTooltip: "重置为默认图标",
				dicesTooltip: "随机图标",
			},
		},
		ribbon: {
			name: "Ribbon 侧边栏",
			enable: {
				name: "启用功能",
				desc: "为左侧 Ribbon 按钮自定义图标",
			},
			list: {
				name: "按钮列表",
				desc: "为 Ribbon 按钮分配图标（按按钮提示文本识别）",
				noneFound: "未找到 Ribbon 按钮",
				resetTooltip: "重置为原始图标",
				refreshTooltip: "刷新列表",
				hasIcon: "已有图标",
				noIcon: "无图标",
				customized: "已自定义",
			},
		},
		fileExplorer: {
			name: "文件浏览器",
			enable: {
				name: "启用功能",
				desc: "为文件浏览器中的文件夹和文件自定义图标",
			},
			folderDefault: {
				name: "文件夹默认图标",
				desc: "为所有文件夹设置统一的默认图标（留空则不显示）",
				resetTooltip: "重置",
			},
			fileDefault: {
				name: "文件默认图标",
				desc: "为未匹配到扩展名规则的文件设置兜底图标（留空则不显示）",
				resetTooltip: "重置",
			},
			inherit: {
				subfolder: {
					name: "子文件夹继承父文件夹图标",
					desc: "子文件夹在没有自身配置时，自动套用最近祖先文件夹的图标（含颜色）",
				},
				file: {
					name: "子文件继承父文件夹图标",
					desc: "文件在没有自身配置、也未匹配扩展名规则时，套用其所在文件夹链的最近图标（含颜色）",
				},
			},
			extensions: {
				name: "按扩展名",
				desc: "为某类扩展名的文件统一分配图标（如 pdf、canvas）；支持复合后缀，如 excalidraw.md 优先于 md",
				placeholder: "输入扩展名，支持批量（如 .xdb .js）...",
				addTooltip: "添加扩展名",
				noneFound: "尚未配置扩展名规则",
			},
			overrides: {
				name: "单项覆盖",
				desc: "在文件树中右键文件/文件夹「设置图标」可单独指定；此处列出已配置项",
				folderSection: "文件夹",
				fileSection: "文件",
				noneFound: "暂无单项覆盖",
			},
			menu: {
				setIcon: "设置图标",
				resetIcon: "重置图标",
			},
		},
		experimental: {
			name: "实验性",
			keepPluginFirst: {
				name: "始终最先加载本插件",
				desc: "自动把本插件保持在 .obsidian/community-plugins.json 数组首位（社区插件按此顺序加载），避免其他插件因加载顺序出现图标空白。每次启用/禁用插件后 Obsidian 会重写该数组，本功能会在本插件加载时自动修正。仅调整顺序、不增删条目；对当前会话无效，下次启动生效。实验性功能，如出现异常请关闭。",
			},
		},
	},
	common: {
		save: "保存",
		add: "添加",
		edit: "编辑",
		delete: "删除",
		cancel: "取消",
	},
	view: {
		CustomIconLib: {
			name: "自定义图标库",
			command: "打开自定义图标库",
			reapplyCommand: "重新应用所有图标",
			reapplyNotice: "已重新应用所有自定义图标",
			searchPlaceholder: "搜索图标...",
			svg: {
				tabName: "SVG（实验性）",
				copyAction: "复制 SVG 代码",
				modal: {
					pasteMode: "粘贴源码",
					uploadMode: "上传文件",
					idPlaceholder: "图标ID (例如: my-icon)",
					contentPlaceholder: "SVG 内容 (<svg>...</svg>)",
					selectFiles: "选择 SVG 文件",
					selectFilesDesc:
						"可以选择多个 SVG 文件进行批量添加，将使用文件名作为图标 ID。",
					selectedFiles: "已选择 {count:number} 个文件",
				},
			},
			pack: {
				tabName: "图标库",
				installing: "正在下载图标库…",
				progress: "正在下载图标 {done:number}/{total:number}…",
				installed: "已安装 {count:number} 个图标，立即生效",
				installFailed: "图标库安装失败",
				iconCount: "图标数",
				licenseLabel: "许可证",
				idLabel: "图标 ID 前缀",
				sourcePackage: "来源包",
				bigPackWarning:
					"该图标集包含 {count:number} 个图标，体积较大，安装与同步耗时可能较长，确定继续？",
				offlineHint: "安装完成后图标存储在本地，离线可用。",
				npmModal: {
					title: "自定义 npm 图标包",
					packIdPlaceholder: "包 ID（小写字母/数字/连字符，如 my-icons）",
					packagePlaceholder: "npm 包名（如 @tabler/icons）",
					globPlaceholder: "SVG 路径 glob（如 icons/outline/*.svg）",
					versionPlaceholder: "版本（可选，默认最新）",
					hint: "从 npm CDN 抓取包内散装 SVG 文件；支持 *、** 与逗号分组多选一语法。",
				},
				uninstallHint:
					"将删除 {count:number} 个图标（本地文件与设置清单），已使用该图标的界面将回退为空白。",
				uninstallFailed: "图标库卸载失败",
				refreshTooltip: "刷新目录",
				installedSection: "已安装",
				noPacksInstalled: "尚未安装任何图标库，从下方目录选择安装。",
				iconCountLabel: "{count:number} 个图标",
				browseTooltip: "浏览图标",
				enabledTooltip: "启用/停用该图标库",
				catalogSection: "图标集目录（Iconify，220+ 集）",
				cachedAt: "目录缓存于 {time}",
				catalogCached: "离线缓存",
				catalogOnline: "在线",
				catalogLoadFailed: "图标集目录加载失败（网络不可用且无缓存）",
				catalogLoading: "正在加载图标集目录…",
				presetsSection: "常用 npm 图标包（一键安装）",
				alreadyInstalled: "已安装",
				backTooltip: "返回",
				detailHint: "只读展示。点击图标可复制完整 ID（CI- 前缀）。",
				previewTitle: "预览",
				previewLoading: "正在加载预览…",
				previewEmpty: "暂无预览样例",
				previewFailed: "预览加载失败",
				showMore: "显示更多（{shown:number}/{total:number}）",
			},
			lucide: {
				tabName: "Lucide",
				count: "共 {count:number} 个图标",
				descHints: {
					all: "插件内置的全部 Lucide 图标（已去重），点击图标可复制名称。",
					builtin:
						"Obsidian 原生已内置的图标，此处供查阅对照，点击图标可复制名称。",
					extra: "插件内置 Lucide 中 Obsidian 原生未包含的图标，点击图标可复制名称。",
				},
				filter: {
					group: "筛选图标",
					all: "全部",
					builtin: "内置",
					extra: "差异",
				},
			},
		},
	},
} satisfies BaseTranslation;

export default zh;
