export function generateUniqueId(): string {
    return 'icon-' + Math.random().toString(36).substr(2, 9);
}

export function updatePreview(previewEl: HTMLDivElement, image: string): void {
    previewEl.empty();
    previewEl.setAttribute('style', `background-image: url('${image}')`);
}

export function convertToCamelCase(name: string): string {
    return name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}