/**
 * 从 SVG 字符串中移除 width 和 height 属性
 * @param svgContent 原始 SVG 字符串
 * @returns 清理后的 SVG 字符串
 */
export function cleanSvg(svgContent: string): string {
	if (!svgContent) return "";

	return svgContent
		.replace(/\s*width=["'][^"']*["']/gi, "")
		.replace(/\s*height=["'][^"']*["']/gi, "");
}

/**
 * 在已占用集合中为 base 找一个未占用的 id：`base-1`、`base-2`…
 *
 * 用于导入图标时的「重命名」冲突策略。调用方负责把返回值加入 taken，
 * 以便同一批次内的多次调用不会撞名。
 */
export function uniqueIconId(base: string, taken: Set<string>): string {
	if (!taken.has(base)) {
		return base;
	}
	let suffix = 1;
	while (taken.has(`${base}-${suffix}`)) {
		suffix++;
	}
	return `${base}-${suffix}`;
}
