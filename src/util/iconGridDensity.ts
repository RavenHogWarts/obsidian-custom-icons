/** 图标网格密度：紧凑 / 标准 / 大 */
export type IconGridDensity = "compact" | "normal" | "large";

export const ICON_GRID_DENSITIES: IconGridDensity[] = [
	"compact",
	"normal",
	"large",
];

/** 传给 VirtualIconGrid 的几何参数 */
export interface IconGridMetrics {
	minColumnWidth: number;
	estimateRowHeight: number;
}

/**
 * 只读紧凑网格（Lucide / 包详情 / 全部）的几何。
 * 图块是「字形铺满」的正方形，行高与列宽一致。
 */
export function compactGridMetrics(density: IconGridDensity): IconGridMetrics {
	switch (density) {
		case "compact":
			return { minColumnWidth: 64, estimateRowHeight: 64 };
		case "large":
			return { minColumnWidth: 90, estimateRowHeight: 90 };
		default:
			return { minColumnWidth: 72, estimateRowHeight: 72 };
	}
}

/**
 * 带操作按钮的网格（我的 SVG）的几何：同款方形图块，列宽略宽一档
 * （用户自导入的图标量少，值得更大的字形）。
 */
export function cardGridMetrics(density: IconGridDensity): IconGridMetrics {
	switch (density) {
		case "compact":
			return { minColumnWidth: 64, estimateRowHeight: 64 };
		case "large":
			return { minColumnWidth: 90, estimateRowHeight: 90 };
		default:
			return { minColumnWidth: 72, estimateRowHeight: 72 };
	}
}
