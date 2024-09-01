import { IconType } from '../manager/types';
import { convertKebabCaseToCamelCase } from './case';
import * as lucideIcons from 'lucide-static';

function svgToDataURI(svgContent: string): string {
  const encodedSVG = encodeURIComponent(svgContent);
  const dataURI = `data:image/svg+xml;charset=utf-8,${encodedSVG}`;
  return dataURI;
}
function cleanSvg(svgContent: string): string {
  if (svgContent.startsWith("<svg")) {
    const updatedSvg = svgContent.replace(/\s+(width|height)="[^"]*"/g, ' $1="24"');
    return updatedSvg;
  }
  return svgContent;
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
    // return cleanSvg(svgContent);
    return svgToDataURI(svgContent);
  }
  return "";
}

export function getThemeColorVariable(variableName: string): string {
  const style = getComputedStyle(document.body);
  return style.getPropertyValue(variableName).trim();
}

export function getResourcePathOfLucide(iconName: string): string {
  return convertKebabCaseToCamelCase(iconName || "file");
}

export function getResourceSrcOfLucide(iconName: string): string {
  let iconSvg = lucideIcons[getResourcePathOfLucide(iconName) as keyof typeof lucideIcons];
  const iconColor = getThemeColorVariable('--tab-text-color-focused-active');
  iconSvg = iconSvg.replace(/stroke=".*?"/g, `stroke="${iconColor}"`);
  return svgToDataURI(iconSvg);
}

export function getResourcePathWithType(src: string, type: IconType): string {
  switch (type) {
    case "local":
      return getResourcePathOfLocal(src);
    case "url":
    case "base64":
      return getResourcePathOfUrlAndBase64(src);
    case "svg":
      return getResourcePathOfSvg(src);
    case "lucide":
      return getResourcePathOfLucide(src);
    default:
      return "";
  }
}

export function getResourceSrcWithType(src: string, type: IconType): string {
  switch (type) {
    case "local":
      return getResourcePathOfLocal(src);
    case "url":
    case "base64":
      return getResourcePathOfUrlAndBase64(src);
    case "svg":
      return getResourcePathOfSvg(src);
    case "lucide":
      return getResourceSrcOfLucide(src);
    default:
      return "";
  }
}