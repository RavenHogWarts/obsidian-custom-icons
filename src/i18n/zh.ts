import { LocalProperty } from './types';

export const ZH: LocalProperty = {
  custom_settings: "添加自定义图标",
  custom_settingsDesc: 
    `
    <h5>简要说明</h5>
    <ul>
      <li>自定义图标支持: 在线URL 或 本地相对(绝对)文件路径 或 base64编码 或 svg标签。 详情查看<a href="https://github.com/RavenHogWarts/obsidian-custom-sidebar-icons/blob/master/README_ZH.md" target="_blank">README</a>。</li>
      <li>lucide源图标支持直接使用lucide图标名称。 详情查看<a href="https://lucide.dev/icons/" target="_blank">lucide</a>。</li>
    </ul>
    `,
  iconLabel: "图标 #{num}",
  fileNamePlaceholder: "输入文件名称",
  imagePlaceholder: "输入图标路径",
  type_custom: "自定义图标",
  type_lucide: "lucide源图标",
  removeButton: "移除",
  addNewIcon: "添加新图标"
};