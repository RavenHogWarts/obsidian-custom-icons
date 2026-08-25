import { nextScrollLeft, overflowSides } from "./scrollStrip";

/** 视口宽 100、内容宽 300 → 最大滚动量 200 */
const view = (scrollLeft: number, scrollWidth = 300) => ({
	scrollLeft,
	clientWidth: 100,
	scrollWidth,
});

describe("nextScrollLeft", () => {
	it("容器不可滚动时不动", () => {
		expect(
			nextScrollLeft(view(0, 100), { start: 0, size: 40 }, 8),
		).toBeNull();
	});

	it("当前项已完整可见时不动", () => {
		expect(
			nextScrollLeft(view(0), { start: 10, size: 40 }, 8),
		).toBeNull();
	});

	it("右侧出界：贴右并留出 padding", () => {
		// end = 150 + 40 + 8 = 198 → 198 - 100
		expect(nextScrollLeft(view(0), { start: 150, size: 40 }, 8)).toBe(98);
	});

	it("左侧出界：贴左并留出 padding", () => {
		expect(nextScrollLeft(view(100), { start: 60, size: 40 }, 8)).toBe(52);
	});

	it("首项贴左时不越过 0", () => {
		expect(nextScrollLeft(view(50), { start: 0, size: 40 }, 8)).toBe(0);
	});

	it("末项贴右时不超过最大滚动量", () => {
		// end = 260 + 40 + 8 = 308 → 208，夹取到 200
		expect(nextScrollLeft(view(0), { start: 260, size: 40 }, 8)).toBe(200);
	});

	it("夹取后等于当前位置时返回 null（避免无意义写入）", () => {
		expect(
			nextScrollLeft(view(200), { start: 260, size: 40 }, 8),
		).toBeNull();
	});
});

describe("overflowSides", () => {
	it("内容不超过视口 → none", () => {
		expect(overflowSides(view(0, 100))).toBe("none");
	});

	it("亚像素误差不算溢出", () => {
		expect(overflowSides(view(0, 100.5))).toBe("none");
	});

	it("停在最左 → 右侧有内容", () => {
		expect(overflowSides(view(0))).toBe("end");
	});

	it("停在最右 → 左侧有内容", () => {
		expect(overflowSides(view(200))).toBe("start");
	});

	it("停在中间 → 两侧都有", () => {
		expect(overflowSides(view(100))).toBe("both");
	});
});
