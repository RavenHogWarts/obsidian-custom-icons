import { Plugin, WorkspaceLeaf } from "obsidian";
import CustomIconsSettingTab from "./ui/reactSettingTab";
import { CustomIconsConfig } from "./manager/types";
import { DEFAULT_SETTINGS } from "./setting/defaultSetting";
import { getResourceSrcWithType } from "./util/path";
import "@/style/styles.css"
import "@/style/settingContent.css"
import '@/style/floatingContainer.css'

export default class CustomIconsPlugin extends Plugin {
	settings: CustomIconsConfig;
	private containerEl: HTMLElement | null = null;
	private mutationObservers = new Map<HTMLElement, MutationObserver>();
	
	async onload() {
		await this.loadSettings();
		this.addSettingTab(new CustomIconsSettingTab(this.app, this));

		this.registerEvent(this.app.workspace.on("layout-change", () => {
			if (activeDocument.contains(this.containerEl)) return;
			this.app.workspace.iterateAllLeaves(leaf => this.manageLeaf(leaf));
		}));
		this.app.workspace.iterateAllLeaves(leaf => this.manageLeaf(leaf));
	}

	onunload() {
		console.log('unloading plugin');
		this.mutationObservers.forEach(observer => observer.disconnect());
	}

	async loadSettings() {
		const loadedSettings = await this.loadData();
		this.settings = loadedSettings ? { ...DEFAULT_SETTINGS, ...loadedSettings } : DEFAULT_SETTINGS;
		if (!loadedSettings) {
			await this.saveSettings();
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async replaceSettings(value: Partial<CustomIconsConfig>){
		this.settings = Object.assign({}, this.settings, value);
		// console.log("[Config] replace setting from", value, "to", this.settings);
		await this.saveSettings();
		this.refreshIcons();
	}

	private manageLeaf(leaf: WorkspaceLeaf){
		if(leaf.getViewState().type === "file-explorer"){
			console.log("file-explorer leaf detected");
			this.containerEl = leaf.view.containerEl.find(':scope > .nav-files-container > div') as HTMLElement;
			if (!this.containerEl) return;

			if (this.mutationObservers.has(this.containerEl)) {
				this.mutationObservers.get(this.containerEl)?.disconnect();
			}

			
			const observer = new MutationObserver(mutations => {
				for (const mutation of mutations) {
					const addedNodesArray = Array.from(mutation.addedNodes);
					for (const addedNode of addedNodesArray) {
						if (addedNode instanceof HTMLElement && addedNode.hasClass('tree-item')) {
							this.refreshIcons();
							return;
						}
					}
				}
			});

			observer.observe(this.containerEl, { subtree: true, childList: true });
			this.mutationObservers.set(this.containerEl, observer);

			this.refreshIcons();
		}
	}

	private refreshIcons() {
    console.log('Refreshing icons...');
		const itemEls = this.containerEl?.findAll(':scope > .tree-item') as HTMLElement[];
		if (itemEls) this.refreshChildIcons(itemEls);
	}
	
	private refreshChildIcons(itemEls: HTMLElement[]) {
		for (const itemEl of itemEls) {
			itemEl.addClass('custom-icon');

			if(itemEl.hasClass('nav-folder')){
				const childEls = itemEl.findAll(':scope > .tree-item-children > .tree-item') as HTMLElement[];
				if(!childEls) return;

				const selfEl = itemEl.find(':scope > .tree-item-self') as HTMLElement;
				if(!selfEl) return;

				const floderEl = selfEl.find(':scope > .nav-folder-title-content') as HTMLElement;
				if(!floderEl) return;
				floderEl.addClass('custom-icon-folder');

				this.refreshChildIcons(childEls);
			}
			else if(itemEl.hasClass('nav-file')){
				const selfEl = itemEl.find(':scope > .tree-item-self') as HTMLElement;
				if(!selfEl) return;
				const fileExt = this.getFileExtension(selfEl.dataset.path);

				const fileEl = selfEl.find(':scope > .nav-file-title-content') as HTMLElement;
				if(!fileEl) return;
				fileEl.addClass('custom-icon-file');

				const iconEl = selfEl.find(':scope > .custom-icon-file-icon') as HTMLElement;
				if(!iconEl){
					const newDiv = document.createElement('div');
					newDiv.classList.add('custom-icon-file-icon');
					const iconConfig = this.getIconConfig(fileExt);
					if (iconConfig) {
						const img = document.createElement('img');
						img.src = getResourceSrcWithType(iconConfig.image.src, iconConfig.type);
						newDiv.appendChild(img);
					}
					fileEl.parentElement?.insertBefore(newDiv, fileEl);
				}			
			}
		}
	}

	private getFileExtension(filePath: string | undefined): string {
    if (!filePath) return '';
    return filePath.includes('.') ? filePath.split('.').pop() as string : filePath;
	}

	private getIconConfig(extension: string) {
    if (!extension) return null;
    const icon = this.settings.navFileIcons.icons.find(icon => icon.extension?.includes(extension));
    return icon || null;
	}
}