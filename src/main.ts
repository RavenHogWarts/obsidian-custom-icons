import { App, Plugin } from 'obsidian';
import { CustomIconSettings, DEFAULT_SETTINGS } from './types';
import { CustomIconSettingTab } from './Tab/CustomIconSettingTab';
import { generateUniqueId, getResourcePath} from './utils/utils';

export default class CustomIconPlugin extends Plugin {
    settings: CustomIconSettings;
    
    async onload() {
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

    refreshIcons() {
        this.settings.customIcons.forEach(icon => {
            const existingStyleEl = document.querySelector(`#style-${icon.id}`);
            if (existingStyleEl) existingStyleEl.remove();
        });
        
        this.settings.customIcons.forEach(icon => {
            icon.id = generateUniqueId();
            const url = getResourcePath(icon.image);
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
                    // -webkit-mask-image: url('${url}');
                    // mask-image: url('${url}');
                    background-color: transparent;
                    background-blend-mode: normal;
                    background-image: url('${url}');
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                }
            `;

            const newStyleEl = document.createElement('style');
            newStyleEl.setAttribute('id', `style-${icon.id}`);
            newStyleEl.textContent = css;
            document.head.appendChild(newStyleEl);
        });

    }
}
