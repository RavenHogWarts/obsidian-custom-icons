import {
	ICON_GRID_DENSITIES,
	cardGridMetrics,
	compactGridMetrics,
} from "./iconGridDensity";

describe("iconGridDensity", () => {
	test("三档齐全且顺序为 紧凑 → 标准 → 大", () => {
		expect(ICON_GRID_DENSITIES).toEqual(["compact", "normal", "large"]);
	});

	test("紧凑网格：列宽随档位单调递增", () => {
		const widths = ICON_GRID_DENSITIES.map(
			(d) => compactGridMetrics(d).minColumnWidth,
		);
		expect(widths[0]).toBeLessThan(widths[1]);
		expect(widths[1]).toBeLessThan(widths[2]);
	});

	test("卡片网格：列宽随档位单调递增", () => {
		const widths = ICON_GRID_DENSITIES.map(
			(d) => cardGridMetrics(d).minColumnWidth,
		);
		expect(widths[0]).toBeLessThan(widths[1]);
		expect(widths[1]).toBeLessThan(widths[2]);
	});

	test("卡片网格每档都比同档紧凑网格更宽（要放名称与操作按钮）", () => {
		for (const density of ICON_GRID_DENSITIES) {
			expect(cardGridMetrics(density).minColumnWidth).toBeGreaterThan(
				compactGridMetrics(density).minColumnWidth,
			);
		}
	});

	test("卡片为方卡，行高与列宽同量级；紧凑网格行高略小于列宽", () => {
		for (const density of ICON_GRID_DENSITIES) {
			const card = cardGridMetrics(density);
			expect(card.estimateRowHeight).toBeGreaterThanOrEqual(
				card.minColumnWidth,
			);
			const grid = compactGridMetrics(density);
			expect(grid.estimateRowHeight).toBeLessThan(grid.minColumnWidth);
		}
	});

	test("未知档位回退到标准（运行时脏数据兜底）", () => {
		const unknown = "weird" as never;
		expect(compactGridMetrics(unknown)).toEqual(
			compactGridMetrics("normal"),
		);
		expect(cardGridMetrics(unknown)).toEqual(cardGridMetrics("normal"));
	});
});
