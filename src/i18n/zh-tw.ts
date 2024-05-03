import { LocalProperty } from "./types";

export const ZHtw: LocalProperty = {
  Tab_Title: "自定義圖標",
  Tab_SidebarIcons: "側邊工作區圖標",
  SidebarIcons_FileName: "輸入檔案名稱",
  Tab_FolderIcons: "資料夾圖標",
  FolderIcons_Default: "設定新建檔案夾圖標預設值",
  FolderIcons_FileName: "輸入資料夾路徑",
  Tab_About: "關於",
  IconID: "{num}",
  IconImg: "輸入圖標路徑",
  Type_Custom: "自定義",
  Type_Lucide: "lucide",
  About: 
  `
  <h5>簡要說明</h5>
  <ul>
    <li>插件會自動在snippets文件夾中生成CustomIcon-AutoGen.css文件。請勿對此文件進行修改，因為修改了也沒用（doge）</li>
  </ul>
  <ul>
    <li>支持自定義圖標：在線URL 或 本地相對（絕對）文件路徑 或 base64編碼 或 svg標籤。詳情查看<a href="https://github.com/RavenHogWarts/obsidian-custom-sidebar-icons/blob/master/README_ZH.md" target="_blank">README</a>。</li>
    <li>支持直接使用lucide源圖標名稱。詳情查看<a href="https://lucide.dev/icons/" target="_blank">lucide</a>。</li>
  </ul>
  `
};