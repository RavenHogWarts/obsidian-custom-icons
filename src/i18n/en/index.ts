import type { BaseTranslation } from "../i18n-types";

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
		fileExplorer: {
			name: "File explorer",
			enable: {
				name: "Enable feature",
				desc: "Customize icons for folders and files in the file explorer",
			},
			folderDefault: {
				name: "Default folder icon",
				desc: "Set a shared default icon for all folders (leave empty to hide)",
				resetTooltip: "Reset",
			},
			fileDefault: {
				name: "Default file icon",
				desc: "Fallback icon for files that match no extension rule (leave empty to hide)",
				resetTooltip: "Reset",
			},
			inherit: {
				subfolder: {
					name: "Subfolders inherit the parent folder icon",
					desc: "When a subfolder has no icon of its own, apply the nearest ancestor folder's icon (color included)",
				},
				file: {
					name: "Files inherit the parent folder icon",
					desc: "When a file has no icon of its own and matches no extension rule, apply the nearest icon from its folder chain (color included)",
				},
			},
			extensions: {
				name: "By extension",
				desc: "Assign a shared icon to files of an extension (e.g. pdf, canvas); compound suffixes are supported, e.g. excalidraw.md takes precedence over md",
				placeholder:
					"Enter extensions, batch supported (e.g. .xdb .js)...",
				addTooltip: "Add extension",
				noneFound: "No extension rules configured yet",
			},
			overrides: {
				name: "Per-item overrides",
				desc: 'Right-click a file/folder in the tree and choose "Set icon" to override individually; configured items are listed here',
				folderSection: "Folders",
				fileSection: "Files",
				noneFound: "No per-item overrides yet",
			},
			menu: {
				setIcon: "Set icon",
				resetIcon: "Reset icon",
			},
		},
		tabHeader: {
			name: "Tab headers",
			enable: {
				name: "Enable feature",
				desc: "Customize icons for workspace tab headers (sidebar tool tabs and editor tabs) with two-level resolution: per-tab overrides take priority, the type mapping acts as fallback for tabs without one, and native icons are kept otherwise. Native icons are hidden, not removed, and are restored automatically when disabled.",
			},
			mapping: {
				name: "Type mapping",
				desc: "Assign fallback icons to view types (data-type), applied to all tabs of the type without a per-tab override; you can also set one in place by right-clicking a tab's icon. Configured entries are listed here.",
				selectType: "Select a view type…",
				addTooltip: "Add mapping",
				fetchTooltip: "Fetch types from currently open tabs",
				noneFound: "No type mappings configured yet",
				resetTooltip: "Delete",
			},
			tabs: {
				name: "Per-tab overrides",
				desc: "Assign icons to individual tabs (type + tab title), taking priority over the type mapping. Click refresh to fetch candidates from open tabs; you can also set one in place by right-clicking a tab's icon. File tabs are identified by file name (same-named files in different folders share it); view tab titles follow the interface language.",
				selectTab: "Select a tab…",
				addTooltip: "Add override",
				fetchTooltip: "Fetch from currently open tabs",
				noneFound: "No per-tab overrides configured yet",
				resetTooltip: "Delete",
			},
			menu: {
				setIcon: "Set icon",
				resetIcon: "Reset icon",
			},
		},
		experimental: {
			name: "Experimental",
			keepPluginFirst: {
				name: "Always load this plugin first",
				desc: "Automatically keep this plugin at the front of the .obsidian/community-plugins.json array (community plugins load in this order) so other plugins never miss icons due to load order. Obsidian rewrites that array on every enable/disable; this feature re-enforces it whenever this plugin loads. It only reorders entries — never adds or removes any. Takes effect on the next restart, not the current session. Experimental: disable it if anything looks wrong.",
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
			searchPlaceholder: "Search icons...",
			svg: {
				tabName: "SVG (Experimental)",
				copyAction: "Copy SVG code",
				modal: {
					pasteMode: "Paste Code",
					uploadMode: "Upload Files",
					idPlaceholder: "Icon ID (e.g.: my-icon)",
					contentPlaceholder: "SVG content (<svg>...</svg>)",
					selectFiles: "Select svg files",
					selectFilesDesc:
						"You can select multiple svg files to batch add icons. File names will be used as icon IDs.",
					selectedFiles: "{count:number} file(s) selected",
				},
			},
			pack: {
				tabName: "Icon packs",
				installing: "Downloading icon pack…",
				progress: "Downloading icons {done:number}/{total:number}…",
				installed:
					"Installed {count:number} icons, effective immediately",
				installFailed: "Failed to install icon pack",
				iconCount: "Icons",
				licenseLabel: "License",
				idLabel: "Icon ID prefix",
				sourcePackage: "Source package",
				bigPackWarning:
					"This set contains {count:number} icons and may take a while to install and sync. Continue?",
				offlineHint:
					"After installation, icons are stored locally and work offline.",
				npmModal: {
					title: "Custom npm icon pack",
					packIdPlaceholder:
						"Pack ID (lowercase/digits/hyphens, e.g. my-icons)",
					packagePlaceholder: "npm package (e.g. @tabler/icons)",
					globPlaceholder: "SVG path glob (e.g. icons/outline/*.svg)",
					versionPlaceholder:
						"Version (optional, defaults to latest)",
					hint: "Fetches loose SVG files from an npm CDN; supports *, ** and comma-separated alternatives.",
				},
				uninstallHint:
					"This removes {count:number} icons (local file and manifest). UI using them will fall back to blank.",
				uninstallFailed: "Failed to uninstall icon pack",
				redownload: "Re-download",
				redownloadTooltip: "Re-download from source",
				redownloadHint:
					"Re-fetches this pack from its source and overwrites the local copy (a newer version may replace the current one). Takes effect immediately; if the download fails, the existing pack is kept.",
				versionLabel: "Version",
				refreshTooltip: "Refresh catalog",
				installedSection: "Installed",
				noPacksInstalled:
					"No icon packs installed yet. Pick one from the catalog below.",
				iconCountLabel: "{count:number} icons",
				browseTooltip: "Browse icons",
				enabledTooltip: "Enable/disable this icon pack",
				catalogSection: "Icon set catalog (Iconify, 220+ sets)",
				cachedAt: "Catalog cached at {time}",
				catalogCached: "offline cache",
				catalogOnline: "online",
				catalogLoadFailed:
					"Failed to load catalog (offline and no cache)",
				catalogLoading: "Loading icon set catalog…",
				presetsSection: "Popular npm icon packs (one-click)",
				alreadyInstalled: "Installed",
				backTooltip: "Back",
				detailHint:
					"Read-only. Click an icon to copy its full ID (CI- prefix).",
				previewTitle: "Preview",
				previewLoading: "Loading preview…",
				previewEmpty: "No preview samples available",
				previewFailed: "Failed to load preview",
				showMore: "Show more ({shown:number}/{total:number})",
			},
			lucide: {
				tabName: "Lucide",
				count: "{count:number} icon(s)",
				descHints: {
					all: "All Lucide icons bundled with the plugin (deduplicated). Click an icon to copy its name.",
					builtin:
						"Icons already built into Obsidian natively, listed for reference. Click an icon to copy its name.",
					extra: "Lucide icons bundled with the plugin but not built into Obsidian. Click an icon to copy its name.",
				},
				filter: {
					group: "Filter icons",
					all: "All",
					builtin: "Built-in",
					extra: "Extra",
				},
			},
		},
	},
} satisfies BaseTranslation;

export default en;
