import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";
import { PluginSettingTab, App } from "obsidian";
import CustomIconsPlugin from "@/src/main";
import SettingsTitle from "./settings/SettingsTitle";
import TabGroup from "./settings/TabGroup";
import SettingsContent from "./settings/SettingsContent";

export default class CustomIconsSettingTab extends PluginSettingTab {
  plugin: CustomIconsPlugin;
  root: Root;
  state: { activeTab: string, activeSubTab: string};

  constructor(app: App, plugin: CustomIconsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.state = { 
      activeTab: 'SidebarTab',
      activeSubTab: ''
    };
  }

  updateState(newState: Record<string, any>) {
    Object.assign(this.state, newState);
    this.display();
  }

  display() {
    const { containerEl } = this;
    if (!this.root) {
      this.root = createRoot(containerEl);
    }
  
    this.root.render(
      <StrictMode>
        <SettingsTitle
          title="Custom Icons"
          tips="Configure your custom icons here."
        />
        <TabGroup 
          tabs={['SidebarTab', 'FolderTab', 'EditorTab', 'AboutTab']}
          activeTab={this.state.activeTab}
          setActiveTab={(tab: string) => {
            this.updateState({ activeTab: tab });
          }}
          activeSubTab={this.state.activeSubTab}
          setActiveSubTab={(subTab: string) => {
            this.updateState({ activeSubTab: subTab });
          }}
        />
        <SettingsContent
          activeTab={this.state.activeTab}
          activeSubTab={this.state.activeSubTab}
        />
      </StrictMode>
    );
  }

  hide() {
    this.root.unmount();
    this.containerEl.empty();
  }
}