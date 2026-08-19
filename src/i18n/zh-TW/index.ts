import type { BaseTranslation } from '../i18n-types'

const zh_TW = {
	settings: {
		communityPlugin: {
			name: "第三方外掛程式",
			enable: {
				name: "啟用功能",
				desc: "為沒有圖示的第三方外掛程式設定添加圖示",
			},
			searchResults: {
				name: "在搜尋結果中顯示圖示",
				desc: "在設定搜尋結果中顯示外掛程式圖示（僅在 Obsidian 1.13.0+ 生效）",
			},
			default: {
				name: "預設圖示",
				desc: "為沒有圖示的第三方外掛程式設定添加預設圖示",
				resetTooltip: "重置",
				dicesTooltip: "隨機",
			},
			search: {
				placeholder: "輸入外掛程式名稱或ID...",
				noneFound: "未找到符合條件的外掛程式",
				resetTooltip: "重置所有為預設圖示",
				dicesTooltip: "隨機所有圖示",
			},
			pluginList: {
				name: "外掛程式列表",
				desc: "為沒有圖示的第三方外掛程式添加自訂圖示（修復 Obsidian v1.11.0）",
				resetTooltip: "重置爲預設圖示",
				dicesTooltip: "隨機圖示",
			},
		},
		ribbon: {
			name: "Ribbon 側邊欄",
			enable: {
				name: "啟用功能",
				desc: "為左側 Ribbon 按鈕自訂圖示",
			},
			list: {
				name: "按鈕列表",
				desc: "為 Ribbon 按鈕分配圖示（按按鈕提示文字識別）",
				noneFound: "未找到 Ribbon 按鈕",
				resetTooltip: "重置為原始圖示",
				refreshTooltip: "重新整理列表",
				hasIcon: "已有圖示",
				noIcon: "無圖示",
				customized: "已自訂",
			},
		},
		experimental: {
			name: "實驗性",
			keepPluginFirst: {
				name: "始終最先載入本插件",
				desc: "自動把本插件保持在 .obsidian/community-plugins.json 陣列首位（社群插件按此順序載入），避免其他插件因載入順序出現圖示空白。每次啟用/停用插件後 Obsidian 會重寫該陣列，本功能會在本插件載入時自動修正。僅調整順序、不增刪條目；對目前工作階段無效，下次啟動生效。實驗性功能，如出現異常請關閉。",
			},
		},
	},
	common: {
		save: "儲存",
		add: "添加",
		edit: "編輯",
		delete: "刪除",
		cancel: "取消",
	},
	view: {
		CustomIconLib: {
			name: "自訂圖示庫",
			command: "打開自訂圖示庫",
			reapplyCommand: "重新套用所有圖示",
			reapplyNotice: "已重新套用所有自訂圖示",
			searchPlaceholder: "搜索圖示...",
			svg: {
				tabName: "SVG（實驗性）",
				copyAction: "複製 SVG 代碼",
				modal: {
					pasteMode: "粘貼源碼",
					uploadMode: "上傳檔案",
					idPlaceholder: "圖示ID (例如: my-icon)",
					contentPlaceholder: "SVG 內容 (<svg>...</svg>)",
					selectFiles: "選擇 SVG 檔案",
					selectFilesDesc: "可以選擇多個 SVG 檔案進行批量添加，將使用檔案名作為圖示 ID。",
					selectedFiles: "已選擇 {count:number} 個檔案",
				},
			},
			lucide: {
				tabName: "Lucide",
				count: "共 {count:number} 個圖示",
				descHint:
					"唯讀展示。以下為外掛內建 Lucide 中 Obsidian 原生未包含的圖示，點擊圖示可複製名稱。",
			},
		},
	},
} satisfies BaseTranslation;

export default zh_TW;
