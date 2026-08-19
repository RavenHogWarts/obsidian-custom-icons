/**
 * Iconify JSON 的纯解析逻辑（无网络、无 DOM 依赖，可单测）
 *
 * 官方格式文档：https://iconify.design/docs/types/iconify-json/
 * 别名解链规则：尺寸覆盖父级、变换合并（两次翻转抵消、旋转相加）。
 */

export interface IconifyIconData {
	body: string;
	width?: number;
	height?: number;
	left?: number;
	top?: number;
	rotate?: 0 | 1 | 2 | 3;
	hFlip?: boolean;
	vFlip?: boolean;
	hidden?: boolean;
}

export interface IconifyAlias extends Partial<IconifyIconData> {
	parent: string;
}

export interface IconifyJSON {
	prefix: string;
	info?: {
		name?: string;
		total?: number;
		version?: string;
		license?: { title?: string; spdx?: string };
	};
	width?: number;
	height?: number;
	lastModified?: number;
	icons: Record<string, IconifyIconData>;
	aliases?: Record<string, IconifyAlias>;
}

/** collections.json 结构（前缀 → 集元数据） */
export interface IconifyCollections {
	[prefix: string]: {
		name?: string;
		total?: number;
		version?: string;
		license?: { title?: string; spdx?: string };
		/** 官方精选样例图标名（用于下载前预览） */
		samples?: string[];
	};
}

/** 解析后的图标（别名已解链、变换已合并） */
export interface ResolvedIcon {
	body: string;
	width: number;
	height: number;
	left: number;
	top: number;
	rotate: 0 | 1 | 2 | 3;
	hFlip: boolean;
	vFlip: boolean;
}

/** 别名解链最大深度（防御循环引用） */
const MAX_ALIAS_DEPTH = 10;

export function resolveIcon(
	json: IconifyJSON,
	name: string,
	depth = 0,
): ResolvedIcon | null {
	const defaults = {
		width: json.width ?? 16,
		height: json.height ?? 16,
	};

	// 真实图标条目
	const icon = json.icons[name];
	if (icon) {
		return {
			body: icon.body,
			width: icon.width ?? defaults.width,
			height: icon.height ?? defaults.height,
			left: icon.left ?? 0,
			top: icon.top ?? 0,
			rotate: icon.rotate ?? 0,
			hFlip: icon.hFlip ?? false,
			vFlip: icon.vFlip ?? false,
		};
	}

	// 别名：沿 parent 解链，尺寸覆盖、变换合并（两次翻转抵消、旋转相加）
	const alias = json.aliases?.[name];
	if (!alias || depth >= MAX_ALIAS_DEPTH) {
		return null;
	}
	const parent = resolveIcon(json, alias.parent, depth + 1);
	if (!parent) {
		return null;
	}
	return {
		body: parent.body,
		width: alias.width ?? parent.width,
		height: alias.height ?? parent.height,
		left: alias.left ?? parent.left,
		top: alias.top ?? parent.top,
		rotate:
			(((parent.rotate + (alias.rotate ?? 0)) % 4) + 4) %
			(4 as const) as 0 | 1 | 2 | 3,
		hFlip: parent.hFlip !== (alias.hFlip ?? false),
		vFlip: parent.vFlip !== (alias.vFlip ?? false),
	};
}

/** 按 Iconify 变换规则包裹 body：嵌套 <g> 保证旋转/翻转组合总是正确 */
function wrapWithTransforms(icon: ResolvedIcon): string {
	let content = icon.body;
	if (icon.rotate) {
		content = `<g transform="rotate(${icon.rotate * 90} ${icon.width / 2} ${icon.height / 2})">${content}</g>`;
	}
	if (icon.hFlip && icon.vFlip) {
		content = `<g transform="rotate(180 ${icon.width / 2} ${icon.height / 2})">${content}</g>`;
	} else if (icon.hFlip) {
		content = `<g transform="translate(${icon.width} 0) scale(-1 1)">${content}</g>`;
	} else if (icon.vFlip) {
		content = `<g transform="translate(0 ${icon.height}) scale(1 -1)">${content}</g>`;
	}
	return content;
}

export function iconifyIconToSvg(icon: ResolvedIcon): string {
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.left} ${icon.top} ${icon.width} ${icon.height}">` +
		wrapWithTransforms(icon) +
		`</svg>`
	);
}
