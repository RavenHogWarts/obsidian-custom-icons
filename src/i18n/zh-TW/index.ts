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
		},
	},
} satisfies BaseTranslation;

export default zh_TW;
