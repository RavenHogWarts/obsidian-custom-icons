export interface CustomIconsConfig {
  sidebarWorkspaceIcons: sidebarWorkspaceIconsConfig[];
  navFolderIcons: navFolderIconsConfig[];
  navFileIcons: navFileIconsConfig[];
}

export interface sidebarWorkspaceIconsConfig {
  defaultIcon?: defaultIconDetail;
  icons: sidebarWorkspaceIconsDetail[];
}
export interface sidebarWorkspaceIconsDetail {
  id: string;
  image: imageDetail;
  type: iconType;
  label: string;
  sort: number;
}

export interface navFolderIconsConfig {
  defaultIcon?: defaultIconDetail;
  icons: navFolderIconsDetail[];
}
export interface navFolderIconsDetail {
  id: string;
  image: imageDetail;
  type: iconType;
  path: string;
  sort: number;
}

export interface navFileIconsConfig {
  defaultIcon?: defaultIconDetail;
  icons: navFileIconsDetail[];
}
export interface navFileIconsDetail {
  id: string;
  image: imageDetail;
  type: iconType;
  extension: string[];
  sort: number;
}

export interface defaultIconDetail {
  image: imageDetail;
  type: iconType;
}

export interface imageDetail {
  src: string;
  color?: string;
}

export type iconType = 
| "local"
| "url"
| "svg"
| "base64"
| "lucide";