import * as internal from "stream";

export function updatePreview(previewEl: HTMLDivElement, image: string): void {
    previewEl.empty();

    if (image) {
        previewEl.style.backgroundImage = `url(${image})`;
        previewEl.style.backgroundSize = "contain";
        previewEl.style.backgroundRepeat = 'no-repeat';
        previewEl.style.backgroundPosition = 'center';
    }
}

export function svgToBase64(image: string): string {
    image = image.replace(/\bwidth="[^"]*"\b|\bheight="[^"]*"\b/g, '');
    const encodedSvgData = window.btoa(unescape(encodeURIComponent(image)));
    return `data:image/svg+xml;base64,${encodedSvgData}`;
}

export function getResourcePath(path: string): string {
    if (/^(https?:\/\/|data:)/.test(path)) {
        return path;
    }

    if (path.startsWith("<svg")) {
        const encodedSVG = encodeURIComponent(path);
        return 'data:image/svg+xml;charset=utf-8,' + encodedSVG;
    }

    const adapter = this.app.vault.adapter;

    if (path.startsWith("/")) {
        return this.resourceBase + path;
    } else {
        return adapter.getResourcePath(path);
    }
}

export function generateUniqueId(): string {
    return 'icon-' + Math.random().toString(36).substr(2, 9);
}