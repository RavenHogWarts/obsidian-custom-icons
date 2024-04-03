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