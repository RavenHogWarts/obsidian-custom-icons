import { DEFAULT_SETTINGS } from "@/src/setting/defaultSetting";
import { generateUniqueId } from "@/src/util/uuid";
import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

export type IconType = "local" | "url" | "svg" | "base64" | "lucide";
export type ExtraProps = 'label' | 'path' | 'extension';
export type LucideIconName = keyof typeof dynamicIconImports;

export interface LucideIconProps extends Omit<LucideProps, 'ref'> {
  name: LucideIconName;
}

export interface ImageDetail {
  src: string;
  color?: string;
}

export interface IconDetail {
  id: string;
  image: ImageDetail;
  type: IconType;
  sort?: number;
  label?: string;
  path?: string;
  extension?: string[];
}

export interface IconsConfig {
  defaultIcon: IconDetail;
  icons: IconDetail[];
}

export interface CustomIconsConfig {
  sidePinFileIcons: IconsConfig;
  navFolderIcons: IconsConfig;
  navFileIcons: IconsConfig;
}

export class DefaultIconConfig implements IconDetail {
  id: string;
  image: ImageDetail;
  type: IconType;
  sort: number;
  label?: string;
  path?: string;
  extension?: string[];

  constructor(configKey: keyof CustomIconsConfig, extraProps?: Partial<IconDetail>) {
    const defaultIcon = DEFAULT_SETTINGS[configKey].defaultIcon;
    this.id = generateUniqueId(configKey);
    this.image = {
      src: defaultIcon?.image.src ?? '',
      color: defaultIcon?.image.color,
    };
    this.type = defaultIcon?.type ?? 'lucide';
    this.sort = 0;
    Object.assign(this, extraProps);
  }
}