import { computeColumns } from "./useResponsiveColumns";

describe("computeColumns", () => {
	const MIN = 130;
	const GAP = 12;

	it("returns at least 1 column for tiny/zero/negative widths", () => {
		expect(computeColumns(0, MIN, GAP)).toBe(1);
		expect(computeColumns(-100, MIN, GAP)).toBe(1);
		expect(computeColumns(50, MIN, GAP)).toBe(1);
	});

	it("fits exactly one column at the min width", () => {
		expect(computeColumns(130, MIN, GAP)).toBe(1);
	});

	it("adds a column only once the gap + next min fits", () => {
		// 2 列需要 2*130 + 12 = 272
		expect(computeColumns(271, MIN, GAP)).toBe(1);
		expect(computeColumns(272, MIN, GAP)).toBe(2);
	});

	it("matches the auto-fill formula for wider containers", () => {
		// 3 列: 3*130 + 2*12 = 414；4 列: 4*130 + 3*12 = 556
		expect(computeColumns(414, MIN, GAP)).toBe(3);
		expect(computeColumns(555, MIN, GAP)).toBe(3);
		expect(computeColumns(556, MIN, GAP)).toBe(4);
	});

	it("guards against invalid min width", () => {
		expect(computeColumns(500, 0, GAP)).toBe(1);
	});
});
