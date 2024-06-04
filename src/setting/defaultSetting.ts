import { CustomIconsConfig } from "@/src/manager/types";

export const DEFAULT_SETTINGS: CustomIconsConfig = {
  sidebarWorkspaceIcons: [{
    defaultIcon: {
      image: {
        src: "file",
      },
      type: "lucide"
    },
    icons: []
  }],
  navFolderIcons: [{
    defaultIcon: {
      image: {
        src: "crown",
      },
      type: "lucide"
    },
    icons: []
  }],
  navFileIcons: [{
    defaultIcon: {
      image: {
        src: "file-text",
      },
      type: "lucide"
    },
    icons: []
  }],
}