import { Notice, Plugin } from "obsidian";
import CustomIconsSettingTab from "@/src/ui/reactSettingTab";
import { CustomIconsConfig } from "@/src/manager/types";
import { DEFAULT_SETTINGS } from "@/src/setting/defaultSetting";
import "@/style/styles.css"

export default class CustomIconsPlugin extends Plugin {
    settings: CustomIconsConfig;
    
    async onload() {
        try {
            await this.loadSettings();
            this.addSettingTab(new CustomIconsSettingTab(this.app, this));
        } catch (e) {
            new Notice('error when load plugin "Custom Icons"' + e.message);
        }
    }

    onunload() {
        console.log('unloading plugin');
    }

    async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
		// console.log("[Config] loading plugins", this.settings);
	}

    async saveSettings() {
        await this.saveData(this.settings);
    }
}