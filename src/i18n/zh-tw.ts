import { LocalProperty } from "./types";

export const ZHtw: LocalProperty = {
  custom_settings: "新增自定義圖標",
  custom_settingsDesc: 
    `
    <h5>簡要說明</h5>
    <ul>
      <li>自定義圖標支持：在線URL或本地相對（絕對）文件路徑或base64編碼或svg標籤。詳情查看<a href="https://github.com/RavenHogWarts/obsidian-custom-sidebar-icons/blob/master/README_ZH.md" target="_blank">README</a>。</li>
      <li>Lucide源圖標支持直接使用lucide圖標名稱。詳情查看<a href="https://lucide.dev/icons/" target="_blank">lucide</a>。</li>
    </ul>
    `,
  iconLabel: "圖標 #{num}",
  fileNamePlaceholder: "輸入文件名稱",
  imagePlaceholder: "輸入圖標路徑",
  type_custom: "自定義圖標",
  type_lucide: "lucide原始圖標",
  removeButton: "移除",
  addNewIcon: "新增圖標"
};