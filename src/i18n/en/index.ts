import type { BaseTranslation } from '../i18n-types'

const en = {
	settings: {
		communityPlugin: {
			name: "Community plugins",
			enable: {
				name: "Enable feature",
				desc: "Add icons for community plugins without icons",
			},
			searchResults: {
				name: "Show icons in search results",
				desc: "Show plugin icons in settings search results (only effective in Obsidian 1.13.0+)",
			},
			default: {
				name: "Default icon",
				desc: "Set a default icon for community plugins without icons",
				resetTooltip: "Reset",
				dicesTooltip: "Random",
			},
			search: {
				placeholder: "Enter plugin name or ID...",
				noneFound: "No matching plugins found",
				resetTooltip: "Reset all to default icon",
				dicesTooltip: "Random all icons",
			},
			pluginList: {
				name: "Plugin list",
				desc: "Add custom icons for community plugins without icons (fix for Obsidian v1.11.0)",
				resetTooltip: "Reset to default icon",
				dicesTooltip: "Random icon",
			},
		},
		ribbon: {
			name: "Ribbon",
			enable: {
				name: "Enable feature",
				desc: "Customize icons for the left ribbon actions",
			},
			list: {
				name: "Action list",
				desc: "Assign icons to ribbon actions (identified by tooltip text)",
				noneFound: "No ribbon actions found",
				resetTooltip: "Reset to original icon",
				refreshTooltip: "Refresh list",
				hasIcon: "Has icon",
				noIcon: "No icon",
				customized: "Customized",
			},
		},
	},
	common: {
		save: "Save",
		add: "Add",
		edit: "Edit",
		delete: "Delete",
		cancel: "Cancel",
	},
	view: {
		CustomIconLib: {
			name: "Custom icon library",
			command: "Open custom icon library",
			reapplyCommand: "Reapply all icons",
			reapplyNotice: "All custom icons reapplied",
			searchPlaceholder: "Search icon...",
			svg: {
				tabName: "SVG (Experimental)",
				copyAction: "Copy SVG code",
				modal: {
					pasteMode: "Paste Code",
					uploadMode: "Upload Files",
					idPlaceholder: "Icon ID (e.g: my-icon)",
					contentPlaceholder: "SVG content (<svg>...</svg>)",
					selectFiles: "Select svg files",
					selectFilesDesc: "You can select multiple svg files to batch add icons. File names will be used as icon IDs.",
					selectedFiles: "{count:number} file(s) selected",
				},
			},
		},
	},
} satisfies BaseTranslation;

export default en;
