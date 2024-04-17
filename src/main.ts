import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { CustomIconSettings, DEFAULT_SETTINGS, EMPTY_PNG_DATA_URL } from './types';
import { generateUniqueId, updatePreview } from './utils/utils';
import { Locals } from './i18n/i18n';

export default class CustomIconPlugin extends Plugin {
    settings: CustomIconSettings;
    styleTag: HTMLStyleElement;
    resourceBase: string;
    
    async onload() {
        let resourcePath = this.app.vault.adapter.getResourcePath("");
		this.resourceBase = resourcePath.match(/(app:\/\/\w*?)\//)?.[1] as string;

        await this.loadSettings();

        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.refreshIcons();
            })
        );
        this.addSettingTab(new CustomIconSettingTab(this.app, this));
    }

    onunload() {
        console.log('Custom Icon Plugin unloaded');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    getResourcePath(path: string): string {
        if (/^(https?:\/\/|data:)/.test(path)) {
            return path;
        }
    
        if (path.startsWith("<svg")) {
            const encodedSVG = encodeURIComponent(path);
            return 'data:image/svg+xml;charset=utf-8,' + encodedSVG;
        }
    
        const adapter = this.app.vault.adapter;
    
        if (path.startsWith("/")) {
            return this.resourceBase + path;
        } else if (/^[c-zC-Z]:[\/\\]/.test(path)) {
            return this.resourceBase +path.replace(/\\/g, '/').replace(/^([c-zC-Z]):/, '/$1:')
        } else {
            return adapter.getResourcePath(path);
        }
    }

    getResourcePathwithType(path: string, type: string): string {
        let PATH = path.trim();
        switch(type){
            case 'custom':
                PATH = this.getResourcePath(path);
                break;
            case 'lucide':
                PATH = this.getResourcePath(EMPTY_PNG_DATA_URL);
                break;
        }
        return PATH;
    }

    refreshIcons() {
        this.settings.customIcons.forEach(icon => {
            document.querySelectorAll(`.workspace-tab-header[aria-label="${icon.label}"]`)
                .forEach(tabHeader => {
                    tabHeader.classList.add('custom-icon');
                    tabHeader.setAttribute('data-icon-id', icon.id);
                    // const iconUrl = this.getResourcePath(icon.image);
                    const iconUrl = this.getResourcePathwithType(icon.image, icon.type);
                    tabHeader.querySelector('.workspace-tab-header-inner-icon')?.setAttribute('style', `background-image: url('${iconUrl}')`);
                });
        });
    }
}

export class CustomIconSettingTab extends PluginSettingTab {
    plugin: CustomIconPlugin;

    constructor(app: App, plugin: CustomIconPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        const t = Locals.get();

        containerEl.empty();
        containerEl.createEl('h2', { text: t.settings });
        new Setting(containerEl).setDesc(t.settingsDesc);
        
        
        this.plugin.settings.customIcons.forEach((icon, index) => {
            let previewEl: HTMLDivElement;

            const iconSetting = new Setting(containerEl)
                .setName(t.iconLabel.replace('{num}', `${index + 1}`))
                // .setDesc(t.svgXmlContent);

            iconSetting.addText(text => {
                text
                    .setValue(icon.label)
                    .setPlaceholder(t.fileNamePlaceholder)
                    .onChange(async (value) => {
                        icon.label = value;
                        await this.plugin.saveSettings();
                        this.plugin.refreshIcons();                        
                    })
            });
            iconSetting.addDropdown(dropdown => {
                dropdown
                    .addOption('custom', "自定义")
                    .addOption('lucide', "lucide图标")
                    .setValue(icon.type || 'custom')
                    .onChange(async (value) => {
                        icon.type = value;
                        // console.log(icon.type);
                        let image = icon.image || EMPTY_PNG_DATA_URL;
                        updatePreview(previewEl, this.plugin.getResourcePathwithType(image, icon.type) );
                    })
            });
            iconSetting.addTextArea(textArea => {
                previewEl = createDiv({ cls: 'icon-preview' });
                textArea.inputEl.parentElement?.prepend(previewEl);
                textArea
                    .setValue(icon.image)
                    .setPlaceholder(t.imagePlaceholder)
                    .onChange(async (value) => {
                        icon.image = value;
                        await this.plugin.saveSettings();
                        this.plugin.refreshIcons();
                        // updatePreview(previewEl, this.plugin.getResourcePath(icon.image.trim() || EMPTY_PNG_DATA_URL) );
                        updatePreview(previewEl, this.plugin.getResourcePathwithType((icon.image.trim() || EMPTY_PNG_DATA_URL), icon.type) );
                    })
                // updatePreview(previewEl, this.plugin.getResourcePath(icon.image.trim() || EMPTY_PNG_DATA_URL) );
                updatePreview(previewEl, this.plugin.getResourcePathwithType((icon.image.trim() || EMPTY_PNG_DATA_URL), icon.type) );
            });
            iconSetting.addButton(button => {
                button
                    .setButtonText(t.removeButton)
                    .setCta()
                    .onClick(async () => {
                        const tabHeaderElement = document.querySelector(`.workspace-tab-header[data-icon-id="${icon.id}"]`);
                        tabHeaderElement?.classList.remove('custom-icon');
                        tabHeaderElement?.removeAttribute('data-icon-id');
                        const iconInnerElement = tabHeaderElement?.querySelector('.workspace-tab-header-inner-icon');
                        iconInnerElement?.removeAttribute('style');

                        this.plugin.settings.customIcons.splice(index, 1);
                        await this.plugin.saveSettings();
                        this.display();
                    })
            });
        });

        new Setting(containerEl)
            .addButton(button =>
                button
                    .setButtonText(t.addNewIcon)
                    .onClick(async () => {
                        this.plugin.settings.customIcons.push({
                            id: generateUniqueId(),
                            label: '',
                            image: '',
                            type: ''
                        });
                        await this.plugin.saveSettings();
                        this.display();
                    })
        );
    }
}
