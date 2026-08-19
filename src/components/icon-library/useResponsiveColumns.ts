import { useEffect, useState } from "react";

/**
 * 与 CSS `repeat(auto-fill, minmax(minColumnWidth, 1fr))` 等价的列数计算。
 * 在给定内容区宽度下，返回能容纳的列数（至少 1 列）。
 *
 * 公式推导：n 列需要 n*min + (n-1)*gap <= W，解得 n <= (W + gap) / (min + gap)。
 */
export function computeColumns(
	contentWidth: number,
	minColumnWidth: number,
	gap: number,
): number {
	if (contentWidth <= 0 || minColumnWidth <= 0) {
		return 1;
	}
	return Math.max(
		1,
		Math.floor((contentWidth + gap) / (minColumnWidth + gap)),
	);
}

/**
 * 观测滚动容器宽度，动态返回当前应渲染的列数。
 * 用于把响应式 auto-fill 网格转换为「固定列数 + 行虚拟化」。
 *
 * @param ref 滚动容器（内容宽度 = clientWidth - 左右 padding）
 * @param minColumnWidth 单列最小宽度（对齐原 CSS 的 minmax 下限）
 * @param gap 列间距（像素，需与行内联样式的 gap 一致）
 */
export function useResponsiveColumns(
	ref: React.RefObject<HTMLElement | null>,
	minColumnWidth: number,
	gap: number,
): number {
	const [columns, setColumns] = useState(1);

	useEffect(() => {
		const el = ref.current;
		if (!el) {
			return;
		}

		const compute = () => {
			const style = getComputedStyle(el);
			const padX =
				parseFloat(style.paddingLeft || "0") +
				parseFloat(style.paddingRight || "0");
			const contentWidth = el.clientWidth - padX;
			const next = computeColumns(contentWidth, minColumnWidth, gap);
			setColumns((prev) => (prev === next ? prev : next));
		};

		compute();
		const ro = new ResizeObserver(compute);
		ro.observe(el);
		return () => ro.disconnect();
	}, [ref, minColumnWidth, gap]);

	return columns;
}
