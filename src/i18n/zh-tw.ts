import { LocalProperty } from "./types";

export const ZHtw: LocalProperty = {
  Tab_Title: "自訂圖標",
  Tab_Sidebar: "側邊工作區",
  Tab_SidebarIcons: "釘選檔案",
  SidebarIcons_FileName: "輸入檔案名稱",
  Tab_Folder: "檔案目錄區",
  Tab_FolderIcons: "檔案夾",
  FolderIcons_Title: "設定檔案夾圖標",
  FolderIcons_Default: "設定新建檔案夾圖標預設值",
  FolderIcons_FileName: "輸入檔案夾路徑",
  Tab_FileIcons: "檔案",
  FileIcons_Title: "設定檔案圖標",
  FileIcons_Default: "設定新建檔案圖標預設值",
  FileIcons_FileExt: "輸入檔案後綴名",
  Tab_Editor: "筆記區",
  Tab_InternalLinkIcons: "內部連結",
  InternalLinkIcons_Title: "設定內部連結圖標",
  Tab_About: "關於",
  IconID: "{num}",
  IconImg: "輸入圖標路徑",
  Type_Custom: "自訂",
  Type_Lucide: "Lucide",
  About: 
  `
  <h3>簡要說明</h3>
  <ul>
    <li>插件會自動在snippets文件夾中生成CustomIcon-AutoGen.css文件。請勿對此文件進行修改，因為修改了也沒用（doge）</li>
  </ul>
  <ul>
    <li>自定義圖標支持：在線URL 或 本地相對(絕對)文件路徑 或 base64編碼 或 svg標籤。 詳情查看<a href="https://github.com/RavenHogWarts/obsidian-custom-sidebar-icons/blob/master/README_ZH.md" target="_blank">README</a>。</li>
    <li>lucide源圖標支持直接使用lucide圖標名稱。 詳情查看<a href="https://lucide.dev/icons/" target="_blank">lucide</a>。</li>
  </ul>
  <ul>
    <li>關於圖標顏色，目前lucide圖標能夠自適應obsidian的基礎顏色</li>
  </ul>
  <h3>Tips</h3>
  <h4>側邊工作區</h4>
  <h5>Pin文件圖標</h5>
  <ul>
    <li>輸入文件名稱</li>
    <li>如果想修改側邊工作區的其他圖標，只需要知道這個圖標對應的標籤名稱，就能修改</li>
  </ul>
  <h4>文件目錄區</h4>
  <h5>文件圖標</h5>
  <ul>
    <li>多個後綴名使用英文逗號隔開，可以為多個後綴名文件設置相同圖標</li>
  </ul>
  <h5>文件夾圖標</h5>
  <ul>
    <li>輸入文件夾路徑</li>
  </ul>
  <h4>筆記區</h3>
  <h5>內部連結圖標</h5>
  <ul>
    <li>1.輸入內鏈文件的後綴，同文件圖標設置方法</li>
    <li>2.在文件的yaml區添加\`cssclasses: [custom-icon]\` 或 \`cssclass: [custom-icon]\`</li>
  </ul>
  <ul>
    <li>對於使用雙鏈，建議加上文件後綴，如\`[[A.md]]\`</li>
    <li>不想在當前筆記中顯示內鏈文件的圖標，去除cssclasses(cssclass)的值即可</li>
  </ul>
  <h3>支持</h3>
  <p>
  如果您覺得這個插件有用，並希望支持其開發，您可以通過以下方式贊助我：</br>
  微信，支付寶，
  <a href="https://afdian.net/a/ravenhogwarts">愛發電</a>，
  <a href="https://www.paypal.com/paypalme/RavenHogwarts">Paypal</a>。</br>
  感謝您的任何支持！
  </p>
  <p align="center">![Related Image](https://s2.loli.net/2024/05/06/lWBj3ObszUXSV2f.png)</p>
  `,
  Tips: "插件使用說明請查看[關於]界面",
};