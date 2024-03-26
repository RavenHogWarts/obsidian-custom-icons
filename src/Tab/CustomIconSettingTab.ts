import CustomIconPlugin from '../main';
import { App, PluginSettingTab, Setting } from 'obsidian';
import { updatePreview, svgToBase64 } from '../utils/utils';


export class CustomIconSettingTab extends PluginSettingTab {
    plugin: CustomIconPlugin;
    previewEl: HTMLDivElement;
    private iconIdCounter: number = 0;

    constructor(app: App, plugin: CustomIconPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: '自定义图标设置' });
        

        // 图标设置列表
        this.plugin.settings.customIcons.forEach((icon, index) => {
            let previewEl: HTMLDivElement;

            const iconSetting = new Setting(containerEl)
                .setName(`图标 #${index + 1}`)
                .setDesc('请输入SVG的XML内容');

            iconSetting.addText(text =>
                text
                    .setValue(icon.label)
                    .setPlaceholder('文件名称')
                    .onChange(async (value) => {
                        icon.label = value;
                        await this.plugin.saveSettings();
                        this.plugin.refreshIcons();
                        
                        
                    }));
            iconSetting.addTextArea(textArea => {
                previewEl = createDiv({
                    attr: {
                      style:
                        "width: 32px;height: 32px;border-radius: 50%;border:1px solid var(--background-modifier-border)",
                    },
                  });
                textArea.inputEl.parentElement?.prepend(previewEl);
                textArea
                    .setValue(icon.svgData)
                    .setPlaceholder('在这里粘贴SVG代码')
                    .onChange(async (value) => {
                        icon.svgData = value;
                        await this.plugin.saveSettings();
                        this.plugin.refreshIcons();
                        updatePreview(previewEl, svgToBase64(value));
                    })
                updatePreview(previewEl, svgToBase64(icon.svgData)); 
            });
            iconSetting.addButton(button => {
                button
                    .setButtonText('移除')
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

        // 添加图标按钮
        new Setting(containerEl)
            .addButton(button =>
                button
                    .setButtonText('添加新图标')
                    .onClick(async () => {
                        this.plugin.settings.customIcons.push({
                            id: 'icon-' + this.iconIdCounter++,
                            label: '',
                            svgData: ''
                        });
                        await this.plugin.saveSettings();
                        this.display();
                    })
        );
    }
}