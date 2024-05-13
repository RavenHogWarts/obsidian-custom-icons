import { App, PluginSettingTab, Setting, DropdownComponent, TextAreaComponent, debounce } from 'obsidian';
import CustomIconPlugin from 'src/main';
import { DEFAULT_FILE_ICON, DEFAULT_FOLDER_ICON, DEFAULT_SETTINGS, DEFAULT_SIDEBAR_ICON } from 'src/types';
import { FolderSuggest } from 'src/settings/folderSuggester';
import { generateUniqueId, updatePreview } from 'src/utils/utils';
import { Locals } from 'src/i18n/i18n';
import { LocalProperty } from 'src/i18n/types';


export class CustomIconSettingTab extends PluginSettingTab {
  plugin: CustomIconPlugin;
  activeTab: string = 'SidebarIcons';
  debouncedGenerate: Function;

  constructor(app: App, plugin: CustomIconPlugin) {
      super(app, plugin);
      this.plugin = plugin;
      this.debouncedGenerate = debounce(this.generateSnippet, 1000, true);
  }
  async generateSnippet() {
  await this.plugin.genSnippetCSS(this.plugin);
}

  display(): void {
      const { containerEl } = this;
      const t = Locals.get();

      containerEl.empty();
      const settingsTitle = containerEl.createEl('div', {cls: 'csbi-setting-title'});
      settingsTitle.createEl('h1', {text: `${t.Tab_Title}`});

      const settingsTabHeader = containerEl.createEl('nav', {cls: 'csbi-setting-header'});
      const tabGroup = settingsTabHeader.createEl('div', {cls: 'csbi-setting-tab-group'})

      const SidebarIconsTab = tabGroup.createEl('div', {cls: `csbi-tab ${this.activeTab === 'SidebarIcons' ? 'csbi-tab-active' : ''}`, text: `${t.Tab_SidebarIcons}`});
      SidebarIconsTab.addEventListener('click', () => {
          this.activeTab = 'SidebarIcons';
          this.display();
      });
      const FolderIconsTab = tabGroup.createEl('div', {cls: `csbi-tab ${this.activeTab === 'FolderIcons' ? 'csbi-tab-active' : ''}`, text: `${t.Tab_FolderIcons}`});
      FolderIconsTab.addEventListener('click', () => {
          this.activeTab = 'FolderIcons';
          this.display();
      });
      const AboutTab = tabGroup.createEl('div', {cls: `csbi-tab ${this.activeTab === 'About' ? 'csbi-tab-active' : ''}`, text: `${t.Tab_About}`});
      AboutTab.addEventListener('click', () => {
          this.activeTab = 'About';
          this.display();
      });

      const settingsContent = containerEl.createEl('div', {cls: 'csbi-setting-content'});
      const settingsFill = settingsTabHeader.createEl('div', {cls: 'csbi-fill'});

      switch (this.activeTab) {
          case 'SidebarIcons':
              this.displaySidebarIcons(settingsContent, t);
              break;
          case 'FolderIcons':
              this.displayFolderIcons(settingsContent, t);
              break;
          case 'About':
              this.displayAbout(settingsContent, t);
              break;
          default:
              break;
      }
  }

  displaySidebarIcons(containerEl: HTMLElement, t: LocalProperty): void {      
      this.SidebarIconsSetting(containerEl, t);
  }

  SidebarIconsSetting(containerEl: HTMLElement, t: LocalProperty): void {
      this.plugin.settings.SidebarIcons.forEach((icon, index) => {
          let previewEl: HTMLDivElement;

          const iconSetting = new Setting(containerEl)
              .setName(t.IconID.replace('{num}', `${icon.id}`))

          iconSetting.addText(text => {
              text
                  .setPlaceholder(t.SidebarIcons_FileName)
                  .setValue(icon.label)
                  .onChange(async (value) => {
                      icon.label = value;
                      await this.plugin.saveSettings();
                      this.plugin.refreshSidebarIcons();
                      this.debouncedGenerate();    
                      let image = icon.image || DEFAULT_SIDEBAR_ICON;
                      updatePreview(previewEl, this.plugin.getResourcePathwithType(image, icon.type) );                    
                  })
          });
          iconSetting.addDropdown(dropdown => {
              dropdown
                  .addOption('custom', t.Type_Custom)
                  .addOption('lucide', t.Type_Lucide)
                  .setValue(icon.type || 'custom')
                  .onChange(async (value) => {
                      icon.type = value;
                      await this.plugin.saveSettings();
                      let image = icon.image || DEFAULT_FILE_ICON;
                      updatePreview(previewEl, this.plugin.getResourcePathwithType(image, icon.type) );
                  })
          });
          iconSetting.addTextArea(textArea => {
              previewEl = createDiv({ cls: 'icon-preview' });
              textArea.inputEl.parentElement?.prepend(previewEl);
              textArea
                  .setPlaceholder(t.IconImg)
                  .setValue(icon.image)
                  .onChange(async (value) => {
                      icon.image = value;
                      await this.plugin.saveSettings();
                      this.plugin.refreshSidebarIcons();
                      this.debouncedGenerate();
                      updatePreview(previewEl, this.plugin.getResourcePathwithType((icon.image.trim() || DEFAULT_SIDEBAR_ICON), icon.type) );
                  })
              updatePreview(previewEl, this.plugin.getResourcePathwithType((icon.image.trim() || DEFAULT_SIDEBAR_ICON), icon.type) );
          });
          iconSetting.addButton(button => {
              button
                  .setIcon("trash-2")
                  .setCta()
                  .onClick(async () => {
                      const tabHeaderElement = document.querySelector(`.workspace-tab-header[data-icon-id="${icon.id}"]`);
                      tabHeaderElement?.classList.remove('custom-icon');
                      tabHeaderElement?.removeAttribute('data-icon-id');
                      this.debouncedGenerate();

                      this.plugin.settings.SidebarIcons.splice(index, 1);
                      await this.plugin.saveSettings();
                      this.display();
                  })
          });
      });

      new Setting(containerEl)
          .addButton(button =>
              button
                  .setIcon("plus")
                  .onClick(async () => {
                      this.plugin.settings.SidebarIcons.push({
                          id: generateUniqueId("sidebar-icon"),
                          label: '',
                          image: '',
                          type: "custom"
                      });
                      await this.plugin.saveSettings();
                      this.display();
                  })
      );
  }

  displayFolderIcons(containerEl: HTMLElement, t: LocalProperty): void {
      this.DefaultFileIcon(containerEl,t);
      this.FileIconsSetting(containerEl,t);
      this.DefaultFolderIcon(containerEl,t);
      this.FolderIconsSetting(containerEl,t);
  }

  DefaultFolderIcon(containerEl: HTMLElement, t: LocalProperty): void {
      let previewEl: HTMLDivElement;
      let dropdownComponent: DropdownComponent;
      let textAreaComponent: TextAreaComponent;
      const icon = this.plugin.settings.DefaultFolderIcon[0];
      
      containerEl.createEl('h2', {text: t.FolderIcons_Title});

      const iconSetting = new Setting(containerEl)
          .setName(t.FolderIcons_Default);
  
      iconSetting.addDropdown(dropdown => {
          dropdownComponent =  dropdown;
          dropdown
              .addOption('custom', t.Type_Custom)
              .addOption('lucide', t.Type_Lucide)
              .setValue(icon.type || 'custom')
              .onChange(async (value) => {
                  icon.type = value;
                  let image = icon.image || DEFAULT_FOLDER_ICON;
                  updatePreview(previewEl, this.plugin.getResourcePathwithType(image, icon.type));
                  await this.plugin.saveSettings();
              });
      });
      iconSetting.addTextArea(textArea => {
          textAreaComponent = textArea;
          previewEl = createDiv({ cls: 'icon-preview' });
          textArea.inputEl.parentElement?.prepend(previewEl);
          textArea
              .setPlaceholder(t.IconImg)
              .setValue(icon.image)
              .onChange(async (value) => {
                  icon.image = value;
                  updatePreview(previewEl, this.plugin.getResourcePathwithType((icon.image.trim() || DEFAULT_FOLDER_ICON), icon.type));
                  await this.plugin.saveSettings();
              });
          updatePreview(previewEl, this.plugin.getResourcePathwithType((icon.image.trim() || DEFAULT_FOLDER_ICON), icon.type));
      });
      iconSetting.addButton(button => {
          button
              .setIcon("rotate-cw")
              .setCta()
              .onClick(async () => {
                  icon.type = DEFAULT_SETTINGS.DefaultFolderIcon[0].type;
                  icon.image = DEFAULT_SETTINGS.DefaultFolderIcon[0].image;
                  dropdownComponent.setValue(icon.type);
                  textAreaComponent.setValue(icon.image);
                  updatePreview(previewEl, this.plugin.getResourcePathwithType(icon.image, icon.type));
                  await this.plugin.saveSettings();
              });
      });
  }

  DefaultFileIcon(containerEl: HTMLElement, t: LocalProperty): void {
      let previewEl: HTMLDivElement;
      let dropdownComponent: DropdownComponent;
      let textAreaComponent: TextAreaComponent;
      const icon = this.plugin.settings.DefaultFileIcon[0];

      containerEl.createEl('h2', {text: t.FileIcons_Title});

      const iconSetting = new Setting(containerEl)
          .setName(t.FileIcons_Default);
  
      iconSetting.addDropdown(dropdown => {
          dropdownComponent =  dropdown;
          dropdown
              .addOption('custom', t.Type_Custom)
              .addOption('lucide', t.Type_Lucide)
              .setValue(icon.type || 'custom')
              .onChange(async (value) => {
                  icon.type = value;
                  let image = icon.image || DEFAULT_FILE_ICON;
                  updatePreview(previewEl, this.plugin.getResourcePathwithType(image, icon.type));
                  await this.plugin.saveSettings();
              });
      });
      iconSetting.addTextArea(textArea => {
          textAreaComponent = textArea;
          previewEl = createDiv({ cls: 'icon-preview' });
          textArea.inputEl.parentElement?.prepend(previewEl);
          textArea
              .setPlaceholder(t.IconImg)
              .setValue(icon.image)
              .onChange(async (value) => {
                  icon.image = value;
                  updatePreview(previewEl, this.plugin.getResourcePathwithType((icon.image.trim() || DEFAULT_FILE_ICON), icon.type));
                  await this.plugin.saveSettings();
              });
          updatePreview(previewEl, this.plugin.getResourcePathwithType((icon.image.trim() || DEFAULT_FILE_ICON), icon.type));
      });
      iconSetting.addButton(button => {
          button
              .setIcon("rotate-cw")
              .setCta()
              .onClick(async () => {
                  icon.type = DEFAULT_SETTINGS.DefaultFileIcon[0].type;
                  icon.image = DEFAULT_SETTINGS.DefaultFileIcon[0].image;
                  dropdownComponent.setValue(icon.type);
                  textAreaComponent.setValue(icon.image);
                  updatePreview(previewEl, this.plugin.getResourcePathwithType(icon.image, icon.type));
                  await this.plugin.saveSettings();
              });
      });
  }

  FolderIconsSetting(containerEl: HTMLElement, t: LocalProperty): void {
      this.plugin.settings.FolderIcons.forEach((icon, index) => {
          let previewEl: HTMLDivElement;

          const iconSetting = new Setting(containerEl)
              .setName(t.IconID.replace('{num}', `${icon.id}`))
          
          iconSetting.addSearch(search => {
              new FolderSuggest(this.app, search.inputEl);
              search
                  .setPlaceholder(t.FolderIcons_FileName)
                  .setValue(icon.path)
                  .onChange(path => {
                      icon.path = path;
                      this.plugin.saveSettings();
                      this.debouncedGenerate();
                      let image = icon.image || DEFAULT_FOLDER_ICON;
                      updatePreview(previewEl, this.plugin.getResourcePathwithType(image, icon.type));
                  })
          });
          iconSetting.addDropdown(dropdown => {
              dropdown
                  .addOption('custom', t.Type_Custom)
                  .addOption('lucide', t.Type_Lucide)
                  .setValue(icon.type || 'custom')
                  .onChange(async (value) => {
                      icon.type = value;
                      await this.plugin.saveSettings();
                      this.debouncedGenerate();
                      let image = icon.image || DEFAULT_FOLDER_ICON;
                      updatePreview(previewEl, this.plugin.getResourcePathwithType(image, icon.type));
                  })
          });
          iconSetting.addTextArea(textArea => {
              previewEl = createDiv({ cls: 'icon-preview' });
              textArea.inputEl.parentElement?.prepend(previewEl);
              textArea
                  .setPlaceholder(t.IconImg)
                  .setValue(icon.image)
                  .onChange(async (value) => {
                      icon.image = value;
                      await this.plugin.saveSettings();
                      this.debouncedGenerate();
                      updatePreview(previewEl, this.plugin.getResourcePathwithType((icon.image.trim() || DEFAULT_FOLDER_ICON), icon.type));
                  });
              updatePreview(previewEl, this.plugin.getResourcePathwithType((icon.image.trim() || DEFAULT_FOLDER_ICON), icon.type));
          });
          iconSetting.addButton(button => {
              button
                  .setIcon("trash-2")
                  .setCta()
                  .onClick(async () => {
                      const tabHeaderElement = document.querySelector(`.nav-folder-title[data-icon-id="${icon.id}"]`);
                      tabHeaderElement?.classList.remove('custom-icon');
                      tabHeaderElement?.removeAttribute('data-icon-id');
                      this.debouncedGenerate();

                      this.plugin.settings.FolderIcons.splice(index, 1);
                      await this.plugin.saveSettings();
                      this.display();
                  })
          });
      });

      new Setting(containerEl)
          .addButton(button =>
              button
                  .setIcon("plus")
                  .onClick(async () => {
                      this.plugin.settings.FolderIcons.push({
                          id: generateUniqueId("folder-icon"),
                          path: '',
                          image: this.plugin.settings.DefaultFolderIcon[0].image,
                          type: this.plugin.settings.DefaultFolderIcon[0].type
                      });
                      await this.plugin.saveSettings();
                      this.display();
                  })
      );
  }

  FileIconsSetting(containerEl: HTMLElement, t: LocalProperty): void {
      this.plugin.settings.FileIcons.forEach((icon, index) => {
          let previewEl: HTMLDivElement;

          const iconSetting = new Setting(containerEl)
              .setName(t.IconID.replace('{num}', `${icon.id}`))
          
          iconSetting.addText(text => {
              text
                  .setPlaceholder(t.FileIcons_FileExt)
                  .setValue(icon.path.join(','))
                  .onChange(async (value) => {
                      icon.path = value.split(',').map(ext => ext.trim());;
                      await this.plugin.saveSettings();
                      this.plugin.refreshSidebarIcons();
                      this.debouncedGenerate();    
                      let image = icon.image || DEFAULT_FILE_ICON;
                      updatePreview(previewEl, this.plugin.getResourcePathwithType(image, icon.type));                    
                  })
          });
          iconSetting.addDropdown(dropdown => {
              dropdown
                  .addOption('custom', t.Type_Custom)
                  .addOption('lucide', t.Type_Lucide)
                  .setValue(icon.type || 'custom')
                  .onChange(async (value) => {
                      icon.type = value;
                      await this.plugin.saveSettings();
                      this.debouncedGenerate();
                      let image = icon.image || DEFAULT_FILE_ICON;
                      updatePreview(previewEl, this.plugin.getResourcePathwithType(image, icon.type));
                  })
          });
          iconSetting.addTextArea(textArea => {
              previewEl = createDiv({ cls: 'icon-preview' });
              textArea.inputEl.parentElement?.prepend(previewEl);
              textArea
                  .setValue(icon.image)
                  .setPlaceholder(t.IconImg)
                  .onChange(async (value) => {
                      icon.image = value;
                      await this.plugin.saveSettings();
                      this.debouncedGenerate();
                      updatePreview(previewEl, this.plugin.getResourcePathwithType((icon.image.trim() || DEFAULT_FILE_ICON), icon.type));
                  })
              updatePreview(previewEl, this.plugin.getResourcePathwithType((icon.image.trim() || DEFAULT_FILE_ICON), icon.type));
          });
          iconSetting.addButton(button => {
              button
                  .setIcon("trash-2")
                  .setCta()
                  .onClick(async () => {
                      const tabHeaderElement = document.querySelector(`.nav-file-title[data-icon-id="${icon.id}"]`);
                      tabHeaderElement?.classList.remove('custom-icon');
                      tabHeaderElement?.removeAttribute('data-icon-id');
                      this.debouncedGenerate();

                      this.plugin.settings.FileIcons.splice(index, 1);
                      await this.plugin.saveSettings();
                      this.display();
                  })
          });
      });

      new Setting(containerEl)
          .addButton(button =>
              button
                  .setIcon("plus")
                  .onClick(async () => {
                      this.plugin.settings.FileIcons.push({
                          id: generateUniqueId("file-icon"),
                          path: [''],
                          image: this.plugin.settings.DefaultFileIcon[0].image,
                          type: this.plugin.settings.DefaultFileIcon[0].type
                      });
                      await this.plugin.saveSettings();
                      this.display();
                  })
      );
  }

  displayAbout(containerEl: HTMLElement, t: LocalProperty): void {
      const pEl = containerEl.createEl('div');
      pEl.addClass("csbi-setting-about");
      pEl.innerHTML = t.About;
  }
}