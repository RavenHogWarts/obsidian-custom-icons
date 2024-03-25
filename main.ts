import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface CustomIconSettings {
    customIcons: Array<{label: string; svgData: string;}>;
}

const DEFAULT_SETTINGS: CustomIconSettings = {
    customIcons: []
}

export default class CustomIconPlugin extends Plugin {
    settings: CustomIconSettings;

    async onload() {
        await this.loadSettings();

        // 注册标签变化时刷新图标的事件
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.refreshIcons();
            })
        );

        // 添加设置标签
        this.addSettingTab(new CustomIconSettingTab(this.app, this));
    }

    onunload() {
        // 插件卸载时的清理逻辑
        console.log('Custom Icon Plugin unloaded');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private encodeSvgData(svgData: string): string {
        // 移除SVG的width和height属性
        svgData = svgData.replace(/width="[^"]*"|height="[^"]*"/g, '');

        // 处理并编码SVG数据为base64 URI
        const encodedSvgData = unescape(encodeURIComponent(svgData));
        return `data:image/svg+xml;base64,${window.btoa(encodedSvgData)}`;
    }

    // 刷新图标的方法
    refreshIcons() {
        // 清除之前的样式以防重复添加
        const styleEl = document.getElementById('custom-icon-styles');
        styleEl?.remove();

        // 创建样式元素
        const newStyleEl = document.createElement('style');
        newStyleEl.setAttribute('id', 'custom-icon-styles');
        let css = '';

        // 遍历所有自定义图标设置
        this.settings.customIcons.forEach(icon => {
            const svgBase64 = this.encodeSvgData(icon.svgData);
            css += `
                .workspace-tab-header[aria-label="${icon.label}"] .workspace-tab-header-inner-icon > svg {
                    display: none;
                }
                .workspace-tab-header[aria-label="${icon.label}"] .workspace-tab-header-inner-icon::before {
                    content: " ";
                    display: inline-block;
                    width: 1em;
                    height: 1em;
                    background-color: var(--text-normal);
                    -webkit-mask-image: url('${svgBase64}');
                    mask-image: url('${svgBase64}');
                }
            `;
        });

        // 将样式添加到文档头部
        newStyleEl.textContent = css;
        document.head.appendChild(newStyleEl);
    }
}

// 这里将会是一个设置界面的实现，用户可以上传和设置自定义图标
// ...

class CustomIconSettingTab extends PluginSettingTab {
    plugin: CustomIconPlugin;

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
            const iconSetting = new Setting(containerEl)
                .setName(`图标 #${index + 1}`)
                .setDesc('请输入SVG的XML内容');

            iconSetting.addText(text =>
                text
                    .setValue(icon.label)
                    .setPlaceholder('图标名称')
                    .onChange(async (value) => {
                        icon.label = value;
                        await this.plugin.saveSettings();
                        this.plugin.refreshIcons();
                    })),
            iconSetting.addTextArea(textArea =>
                textArea
                    .setValue(icon.svgData)
                    .setPlaceholder('在这里粘贴SVG内部元素')
                    .onChange(async (value) => {
                        icon.svgData = value;
                        await this.plugin.saveSettings();
                        this.plugin.refreshIcons();
                    })
            );
            iconSetting.addButton(button =>
                button
                    .setButtonText('移除')
                    .setCta()
                    .onClick(async () => {
                        this.plugin.settings.customIcons.splice(index, 1);
                        await this.plugin.saveSettings();
                        this.display();
                    })
            );
        });

        // 添加图标按钮
        new Setting(containerEl)
            .addButton(button =>
                button
                    .setButtonText('添加新图标')
                    .onClick(async () => {
                        this.plugin.settings.customIcons.push({
                            label: '',
                            svgData: ''
                        });
                        await this.plugin.saveSettings();
                        this.display();
                    })
            );
    }
}

function encodeURIComponentWithNonASCII(str: string): string {
    const asciiPattern = /[!'()*]/g;
    return encodeURIComponent(str).replace(asciiPattern, c =>
        '%' + c.charCodeAt(0).toString(16).toUpperCase()
    );
}

function svgToBase64(svgString: string): string {
    // 移除SVG标签中不必要的属性，比如width和height
    svgString = svgString
        .replace(/width="[^"]*"/g, '')
        .replace(/height="[^"]*"/g, '');

    // 使用encodeURIComponentWithNonASCII函数进行编码
    const encodedSVG = encodeURIComponentWithNonASCII(svgString);

    // 转换为base64格式
    const base64SVG = btoa(encodedSVG);

    return base64SVG;
}