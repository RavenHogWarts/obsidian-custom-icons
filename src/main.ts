import { App, Plugin } from 'obsidian';
import { CustomIconSettings, DEFAULT_SETTINGS } from './types';
import { CustomIconSettingTab } from './Tab/CustomIconSettingTab';
import { svgToBase64 } from './utils/utils';


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

        // 注册设置选项卡
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

    // 刷新图标的方法
    refreshIcons() {
        // 清理所有现有的自定义样式
        this.settings.customIcons.forEach(icon => {
            const existingStyleEl = document.querySelector(`#style-${icon.id}`);
            if (existingStyleEl) existingStyleEl.remove();
        });
        
        // 为每个图标创建新的自定义样式
        this.settings.customIcons.forEach(icon => {
            const svgBase64 = svgToBase64(icon.svgData);
            let css = `
                .workspace-tab-header[aria-label="${icon.label}"] .workspace-tab-header-inner-icon > svg {
                    display: none;
                }
                .workspace-tab-header[aria-label="${icon.label}"] .workspace-tab-header-inner-icon::before {
                    content: " ";
                    display: inline-block;
                    width: 1em;
                    height: 1em;
                    // background-color: var(--text-normal);
                    // -webkit-mask-image: url('${svgBase64}');
                    // mask-image: url('${svgBase64}');
                    background-color: transparent; /* 确保背景透明 */
                    background-blend-mode: normal; /* 正常的背景合成模式 */
                    background-image: url('${svgBase64}');
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                }
            `;

            // 新建样式元素
            const newStyleEl = document.createElement('style');
            newStyleEl.setAttribute('id', `style-${icon.id}`);
            newStyleEl.textContent = css;
            document.head.appendChild(newStyleEl);
        });

    }
}
