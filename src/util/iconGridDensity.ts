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
 * 图块是「字形 + 小号名称」，高度略小于宽度。
 */
export function compactGridMetrics(
	density: IconGridDensity,
): IconGridMetrics {
	switch (density) {
		case "compact":
			return { minColumnWidth: 72, estimateRowHeight: 68 };
		case "large":
			return { minColumnWidth: 124, estimateRowHeight: 112 };
		default:
			return { minColumnWidth: 92, estimateRowHeight: 88 };
	}
}

/**
 * 带名称与操作按钮的卡片网格（我的 SVG）的几何。
 * 卡片是 `aspect-ratio: 1` 的方卡，行高随列宽走，故两者接近。
 */
export function cardGridMetrics(density: IconGridDensity): IconGridMetrics {
	switch (density) {
		case "compact":
			return { minColumnWidth: 84, estimateRowHeight: 96 };
		case "large":
			return { minColumnWidth: 148, estimateRowHeight: 164 };
		default:
			return { minColumnWidth: 110, estimateRowHeight: 130 };
	}
}
