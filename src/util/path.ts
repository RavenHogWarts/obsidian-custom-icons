import * as lucideIcons from 'lucide-static';
import { convertToCamelCase } from './case';

export function svgToDataURI(svgContent: string): string {
  const encodedSVG = encodeURIComponent(svgContent);
  const dataURI = `data:image/svg+xml;charset=utf-8,${encodedSVG}`;
  return dataURI;
}

export function getResourcePathOfLocal(path: string): string {
  const adapter = this.app.vault.adapter;
  this.resourceBase = adapter.getResourcePath("").match(/(app:\/\/\w*?)\//)?.[1] as string;
  if (path.startsWith("/")) {
    return this.resourceBase + path;
  } else if (/^[c-zC-Z]:[\/\\]/.test(path)) {
    return this.resourceBase + path.replace(/\\/g, '/').replace(/^([c-zC-Z]):/, '/$1:');
  } else {
    return adapter.getResourcePath(path);
  }
}

export function getResourcePathOfUrlAndBase64(path: string): string {
  if (/^(https?:\/\/|data:)/.test(path)) {
    return path;
  }
  return "";
}

export function getResourcePathOfSvg(svgContent: string): string {
  if (svgContent.startsWith("<svg")) {
    return svgToDataURI(svgContent);
  }
  return "";
}

export function getResourcePathOfLucide(iconName: string): string {
  const camelCaseIconName = convertToCamelCase(iconName);
  let iconSvg = lucideIcons[camelCaseIconName as keyof typeof lucideIcons];
  const iconColor = getThemeColorVariable('--tab-text-color-focused-active');
  if (iconSvg && iconColor) {
    iconSvg = iconSvg.replace(/stroke=".*?"/g, `stroke="${iconColor}"`);
    return svgToDataURI(iconSvg);
  } else {
    return svgToDataURI('<svg></svg>');
  }
}

export function getThemeColorVariable(variableName: string): string {
  const style = getComputedStyle(document.body);
  return style.getPropertyValue(variableName).trim();
}

export function getResourcePathWithPath(path: string, type: string): string {
  switch (type) {
    case "local":
      return getResourcePathOfLocal(path);
    case "url":
    case "base64":
      return getResourcePathOfUrlAndBase64(path);
    case "svg":
      return getResourcePathOfSvg(path);
    case "lucide":
      return getResourcePathOfLucide(path);
    default:
      return "";
  }
}