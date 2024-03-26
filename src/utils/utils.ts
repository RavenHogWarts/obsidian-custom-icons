export function updatePreview(previewEl: HTMLDivElement, svgBase64: string): void {
    previewEl.empty();

    // 假设svgBase64已经是一个base64编码的SVG数据URL
    if (svgBase64) {
        // 直接使用svgBase64设置背景图
        previewEl.style.backgroundImage = `url(${svgBase64})`;
        previewEl.style.backgroundSize = "contain"; // contain 确保SVG图像不会被拉伸
        previewEl.style.backgroundRepeat = 'no-repeat';
        previewEl.style.backgroundPosition = 'center';
    }
}

export function svgToBase64(svgData: string): string {
    // 移除SVG的width和height属性
    svgData = svgData.replace(/width="[^"]*"|height="[^"]*"/g, '');

    // 编码为base64
    const encodedSvgData = window.btoa(unescape(encodeURIComponent(svgData)));
    return `data:image/svg+xml;base64,${encodedSvgData}`;
}