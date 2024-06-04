import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";
import { PluginSettingTab, App } from "obsidian";
import CustomIconsPlugin from "@/src/main";
import SettingsTitle from "@/src/ui/settings/SettingsTitle";
import TabGroup from "@/src/ui/settings/TabGroup";
import SettingsContent from "@/src/ui/settings/SettingsContent";

export default class CustomIconsSettingTab extends PluginSettingTab {
  plugin: CustomIconsPlugin;
  root: Root;
  state: { activeTab: string, activeSubTab: string};

  constructor(app: App, plugin: CustomIconsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.state = { 
      activeTab: 'SidebarTab',
      activeSubTab: 'SidebarSubTab1'
    };
  }

  updateState(newState: Record<string, any>) {
    Object.assign(this.state, newState);
    this.display();
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    this.root = createRoot(containerEl);
    this.root.render(
      <StrictMode>
        <SettingsTitle
          title="Custom Icons"
          tip="Configure your custom icons here."
        />
        <TabGroup
          activeTab={this.state.activeTab}
          setActiveTab={(tab: string) => {
            this.updateState({ activeTab: tab });
          }}
          tabs={['SidebarTab', 'FolderTab', 'EditorTab', 'AboutTab']}
        />
         <SettingsContent
          activeTab={this.state.activeTab}
          activeSubTab={this.state.activeSubTab}
          setActiveSubTab={(subTab: string) => {
            this.updateState({ activeSubTab: subTab });
          }}
        />
      </StrictMode>
    );
  }

  hide() {
    this.root.unmount();
    this.containerEl.empty();
  }
}