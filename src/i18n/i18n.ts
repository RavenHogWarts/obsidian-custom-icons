import ZH from "@/src/i18n/zh";
import EN from "@/src/i18n/en";

export interface Messages {
  [key: string]: string; // 添加索引签名
  SidebarTab: string;
  sidePinFileTab: string;
  FolderTab: string;
  navFileTab: string;
  navFolderTab: string;
  EditorTab: string;
  EditorSubTab1: string;
  AboutTab: string;
}

export function getLocal(): Messages {
  const lang = window.localStorage.getItem("language");
  switch (lang) {
    case "zh":
    case "zh-TW":
      return new ZH();
    default:
      return new EN();
  }
}