import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { CustomIconSettings, DEFAULT_SETTINGS, EMPTY_PNG_DATA_URL } from './types';
import { generateUniqueId, getResourcePath } from './utils/utils';
import { Locals } from './i18n/i18n';

export default class CustomIconPlugin extends Plugin {
    settings: CustomIconSettings;
    styleTag: HTMLStyleElement;
    
    async onload() {
        await this.loadSettings();

        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.refreshIcons();
            })
        );
        this.addSettingTab(new CustomIconSettingTab(this.app, this));
        this.loadStyles();
    }

    onunload() {
        if (this.styleTag && this.styleTag.parentNode) {
            this.styleTag.parentNode.removeChild(this.styleTag);
        }
        // console.log('Custom Icon Plugin unloaded');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async loadStyles() {
        const cssPath = this.manifest.dir + "/styles.css";
        const cssUrl = this.app.vault.adapter.getResourcePath(cssPath);
        this.styleTag = document.createElement('style');
        this.styleTag.id = 'custom-icon-styles';
        
        document.head.appendChild(this.styleTag);
        
        fetch(cssUrl)
            .then((response) => response.text())
            .then((css) => {
                this.styleTag.textContent = css;
            });
    }

    refreshIcons() {
        // console.log('Refreshing icons', this.settings.customIcons);
        this.settings.customIcons.forEach(icon => {
            // console.log(`Updating icon: ${icon.label}`);
            document.querySelectorAll(`.workspace-tab-header[aria-label="${icon.label}"]`)
                .forEach(tabHeader => {
                    tabHeader.classList.add('custom-icon');
                    // const iconPath = getResourcePath(icon.image);
                    // console.log(`Icon path for ${icon.label}: ${iconPath}`);
                    tabHeader.setAttribute('data-icon-url', getResourcePath(icon.image));
                    tabHeader.setAttribute('data-icon-id', icon.id);
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

            iconSetting.addText(text =>
                text
                    .setValue(icon.label)
                    .setPlaceholder(t.fileNamePlaceholder)
                    .onChange(async (value) => {
                        icon.label = value;
                        await this.plugin.saveSettings();
                        this.plugin.refreshIcons();                        
                    }));
            iconSetting.addTextArea(textArea => {
                previewEl = createDiv({ cls: 'icon-preview' });
                textArea.inputEl.parentElement?.prepend(previewEl);
                textArea
                    .setValue(icon.image)
                    // .setPlaceholder(t.svgCodePlaceholder)
                    .setPlaceholder(t.imagePlaceholder)
                    .onChange(async (value) => {
                        icon.image = value;
                        await this.plugin.saveSettings();
                        this.plugin.refreshIcons();
                        previewEl.dataset.iconUrl = getResourcePath(icon.image.trim() || EMPTY_PNG_DATA_URL);
                    })
                previewEl.dataset.iconUrl = getResourcePath(icon.image.trim() || EMPTY_PNG_DATA_URL);
            });
            iconSetting.addButton(button => {
                button
                    .setButtonText(t.removeButton)
                    .setCta()
                    .onClick(async () => {
                        const styleElToRemove = document.querySelector(`#style-${icon.id}`);
                        styleElToRemove?.remove();
                        
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
                            image: ''
                        });
                        await this.plugin.saveSettings();
                        this.display();
                    })
        );
    }
}
