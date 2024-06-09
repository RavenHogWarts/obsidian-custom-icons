import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";
import { PluginSettingTab, App } from "obsidian";
import CustomIconsPlugin from "@/src/main";
import SettingsTitle from "./settings/frame/SettingsTitle";
import TabGroup from "./settings/frame/TabGroup";
import SettingsContent from "./settings/frame/SettingsContent";
import { ObsidianAppContext } from "./context/obsidianAppContext";

export default class CustomIconsSettingTab extends PluginSettingTab {
  plugin: CustomIconsPlugin;
  root: Root | null = null;
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
    if(!this.root) this.root = createRoot(containerEl);
    
    if (this.root) {
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
          <ObsidianAppContext.Provider value={this.app}>
            <SettingsContent
              activeTab={this.state.activeTab}
              activeSubTab={this.state.activeSubTab}
              config={this.plugin.settings}
              onChange={(config) => {
                this.plugin.replaceSettings(config);
              }}
            />
          </ObsidianAppContext.Provider>
        </StrictMode>
      );
    }
  }

  hide() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    this.containerEl.empty();
  }
}