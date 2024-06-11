import { CustomIconsConfig } from "@/src/manager/types";

export const DEFAULT_SETTINGS: CustomIconsConfig = {
  sidePinFileIcons: {
    defaultIcon: {
      id: "custom-icon-11001100",
      image: {
        src: "file",
        color: "",
      },
      type: "lucide",
      sort: 0,
    },
    icons: [],
  },
  navFolderIcons: {
    defaultIcon: {
      id: "custom-icon-11001101",
      image: {
        src: "crown",
        color: "",
      },
      sort: 0,
      type: "lucide",
    },
    icons: [],
  },
  navFileIcons: {
    defaultIcon: {
      id: "custom-icon-11001110",
      image: {
        src: "file-text",
        color: "",
      },
      sort: 0,
      type: "lucide",
    },
    icons: [],
  },
};