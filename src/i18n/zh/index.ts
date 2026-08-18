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
		},
	},
} satisfies BaseTranslation;

export default zh;
