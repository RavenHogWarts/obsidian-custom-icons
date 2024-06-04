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

export function getResourcePathOfSvg(path: string): string {
  if (path.startsWith("<svg")) {
    return this.svgToDataURI(path);
  }
  return "";
}

export function getResourcePathOfLucide(path: string): string {
  return "";
}

export function getResourcePathWithPath(path: string, type: string): string {
  switch (type) {
    case "local":
      return this.getResourcePathOfLocal(path);
    case "url":
    case "base64":
      return this.getResourcePathOfUrl(path);
    case "svg":
      return this.getResourcePathOfSvg(path);
    case "lucide":
      return this.getResourcePathOfLucide(path);
    default:
      return "";
  }
}