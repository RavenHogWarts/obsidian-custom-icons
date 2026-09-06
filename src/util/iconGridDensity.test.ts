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

	test("两套网格几何完全一致（统一的方形图块，各页观感相同）", () => {
		for (const density of ICON_GRID_DENSITIES) {
			expect(cardGridMetrics(density)).toEqual(compactGridMetrics(density));
		}
	});

	test("图块为正方形：行高估算与列宽一致（无名称行）", () => {
		for (const density of ICON_GRID_DENSITIES) {
			const card = cardGridMetrics(density);
			expect(card.estimateRowHeight).toBe(card.minColumnWidth);
			const grid = compactGridMetrics(density);
			expect(grid.estimateRowHeight).toBe(grid.minColumnWidth);
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
