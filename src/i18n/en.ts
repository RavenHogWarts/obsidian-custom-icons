import { LocalProperty } from './types';

export const EN: LocalProperty = {
  Tab_Title: "Custom Icons",
  Tab_Sidebar: "Sidebar Workspace",
  Tab_SidebarIcons: "Pin Files",
  SidebarIcons_FileName: "Enter File Name",
  Tab_Folder: "Folders Directory",
  Tab_FolderIcons: "Folders",
  FolderIcons_Title: "Set Folder Icons",
  FolderIcons_Default: "Set Default Icon for New Folders",
  FolderIcons_FileName: "Enter Folder Path",
  Tab_FileIcons: "Files",
  FileIcons_Title: "Set File Icons",
  FileIcons_Default: "Set Default Icon for New Files",
  FileIcons_FileExt: "Enter File Extension",
  Tab_Editor: "Notes Area",
  Tab_InternalLinkIcons: "Internal Links",
  InternalLinkIcons_Title: "Set Internal Link Icons",
  Tab_About: "About",
  IconID: "{num}",
  IconImg: "Enter Icon Path",
  Type_Custom: "Custom",
  Type_Lucide: "Lucide",
  About: 
  `
  <h3>Brief Introduction</h3>
  <ul>
    <li>The plugin will automatically generate a CustomIcon-AutoGen.css file in the snippets folder. Do not modify this file as it would be futile (doge).</li>
  </ul>
  <ul>
    <li>Custom icon support: Online URL, local relative (absolute) file path, base64 encoding, or SVG tags. For details, see the <a href="https://github.com/RavenHogWarts/obsidian-custom-sidebar-icons/blob/master/README_ZH.md" target="_blank">README</a>.</li>
    <li>Lucide source icons support using lucide icon names directly. For details, see <a href="https://lucide.dev/icons/" target="_blank">lucide</a>.</li>
  </ul>
  <h3>Tips</h3>
  <h4>Sidebar Workspace</h4>
  <h5>Pin File Icons</h5>
  <ul>
    <li>Enter file name</li>
    <li>To modify other icons in the sidebar workspace, you just need to know the tag name corresponding to the icon to change it.</li>
  </ul>
  <h4>File Directory Area</h4>
  <h5>File Icons</h5>
  <ul>
    <li>Use a comma to separate multiple file extensions, allowing the same icon to be set for multiple file types.</li>
  </ul>
  <h5>Folder Icons</h5>
  <ul>
    <li>Enter folder path</li>
  </ul>
  <h4>Note Area</h3>
  <h5>Internal Link Icons</h5>
  <ul>
    <li>1. Enter the suffix of the linked file, as with the file icon settings.</li>
    <li>2. Add \`cssclasses: [custom-icon]\` or \`cssclass: [custom-icon]\` in the yaml section of the file.</li>
  </ul>
  <ul>
    <li>For using double links, it is recommended to include the file extension, such as \`[[A.md]]\`.</li>
    <li>If you do not want to display the icon of the internal link file in the current note, simply remove the value of cssclasses(cssclass).</li>
  </ul>
  <h3>Support</h3>
  <p>
  If you find this plugin useful and wish to support its development, you can sponsor me through the following ways:</br>
  WeChat, Alipay,
  <a href="https://afdian.net/a/ravenhogwarts">Love to Generate</a>,
  <a href="https://www.paypal.com/paypalme/RavenHogwarts">Paypal</a>.</br>
  Thank you for any support!
  </p>
  <p align="center">![Related Image](https://s2.loli.net/2024/05/06/lWBj3ObszUXSV2f.png)</p>
  `,
  Tips: "For the plugin usage instructions, please see the [About] interface.",
};