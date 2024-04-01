import CustomIconPlugin from '../main';
import { App, PluginSettingTab, Setting } from 'obsidian';
import { updatePreview, getResourcePath } from '../utils/utils';
import { Locals } from 'src/i18n/i18n';
import { EMPTY_PNG_DATA_URL } from 'src/types';

export class CustomIconSettingTab extends PluginSettingTab {
    plugin: CustomIconPlugin;
    private iconIdCounter: number = 0;

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
                previewEl = createDiv({
                    attr: {
                      style:
                        "display: inline-flex; width: 32px; height: 32px; align-items: center; justify-content: center; margin-right: 2px; border-radius: 50%; border: 1px solid var(--background-modifier-border);",
                    },
                  });
                textArea.inputEl.parentElement?.prepend(previewEl);
                textArea
                    .setValue(icon.image)
                    // .setPlaceholder(t.svgCodePlaceholder)
                    .setPlaceholder(t.imagePlaceholder)
                    .onChange(async (value) => {
                        icon.image = value;
                        await this.plugin.saveSettings();
                        this.plugin.refreshIcons();
                        updatePreview(previewEl, getResourcePath(icon.image.trim() || EMPTY_PNG_DATA_URL));
                    })
                updatePreview(previewEl, getResourcePath(icon.image.trim() || EMPTY_PNG_DATA_URL)); 
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
                            id: 'icon-' + this.iconIdCounter++,
                            label: '',
                            image: ''
                        });
                        await this.plugin.saveSettings();
                        this.display();
                    })
        );
    }
}