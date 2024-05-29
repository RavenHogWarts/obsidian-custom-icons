import { LocalProperty } from './types';

export const ZH: LocalProperty = {
  Tab_Title: "Custom Icons",
  Tab_Sidebar: "侧边工作区",
  Tab_SidebarIcons: "Pin文件",
  SidebarIcons_FileName: "输入文件名称",
  Tab_Folder: "文件目录区",
  Tab_FolderIcons: "文件夹",
  FolderIcons_Title: "设置文件夹图标",
  FolderIcons_Default: "设置新建文件夹图标默认值",
  FolderIcons_FileName: "输入文件夹路径",
  Tab_FileIcons: "文件",
  FileIcons_Title: "设置文件图标",
  FileIcons_Default: "设置新建文件图标默认值",
  FileIcons_FileExt: "输入文件后缀名",
  Tab_Editor: "笔记区",
  Tab_InternalLinkIcons: "内部链接",
  InternalLinkIcons_Title: "设置内部链接图标",
  Tab_About: "关于",
  IconID: "{num}",
  IconImg: "输入图标路径",
  Type_Custom: "自定义",
  Type_Lucide: "Lucide",
  About: 
  `
  <h3>简要说明</h3>
  <ul>
    <li>插件会自动在snippets文件夹中生成CustomIcon-AutoGen.css文件。请勿对此文件进行修改，因为修改了也没用（doge）</li>
  </ul>
  <ul>
    <li>自定义图标支持: 在线URL 或 本地相对(绝对)文件路径 或 base64编码 或 svg标签。 详情查看<a href="https://github.com/RavenHogWarts/obsidian-custom-sidebar-icons/blob/master/README_ZH.md" target="_blank">README</a>。</li>
    <li>lucide源图标支持直接使用lucide图标名称。 详情查看<a href="https://lucide.dev/icons/" target="_blank">lucide</a>。</li>
  </ul>
  <ul>
    <li>关于图标颜色，目前lucide图标能够自适应obsidian的基础颜色</li>
  </ul>
  <h3>Tips</h3>
  <h4>侧边工作区</h4>
  <h5>Pin文件图标</h5>
  <ul>
    <li>输入文件名称</li>
    <li>如果想修改侧边工作区的其他图标，只需要知道这个图标对应的标签名称，就能修改</li>
  </ul>
  <h4>文件目录区</h4>
  <h5>文件图标</h5>
  <ul>
    <li>多个后缀名使用英文逗号隔开，可以为多个后缀名文件设置相同图标</li>
  </ul>
  <h5>文件夹图标</h5>
  <ul>
    <li>输入文件夹路径</li>
  </ul>
  <h4>笔记区</h3>
  <h5>内部链接图标</h5>
  <ul>
    <li>1.输入内链文件的后缀，同文件图标设置方法</li>
    <li>2.在文件的yaml区添加\`cssclasses: [custom-icon]\` 或 \`cssclass: [custom-icon]\`</li>
  </ul>
  <ul>
    <li>对于使用双链，建议加上文件后缀，如\`[[A.md]]\`</li>
    <li>不想在当前笔记中显示内链文件的图标，去除cssclasses(cssclass)的值即可</li>
  </ul>
  <h3>支持</h3>
  <p>
  如果您觉得这个插件有用，并希望支持其开发，您可以通过以下方式赞助我：</br>
  微信，支付宝，
  <a href="https://afdian.net/a/ravenhogwarts">爱发电</a>，
  <a href="https://www.paypal.com/paypalme/RavenHogwarts">Paypal</a>。</br>
  感谢您的任何支持！
  </p>
  <p align="center"><img src="https://s2.loli.net/2024/05/06/lWBj3ObszUXSV2f.png" width="500px"></p>
  `,
  Tips: "插件使用说明请查看[关于]界面",
};