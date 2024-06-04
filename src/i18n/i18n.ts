import ZH from "@/src/i18n/zh";
import EN from "@/src/i18n/en";

export interface Messages {

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