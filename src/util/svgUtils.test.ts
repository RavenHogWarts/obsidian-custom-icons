import { uniqueIconId } from "./svgUtils";

describe("uniqueIconId", () => {
	test("未被占用时原样返回", () => {
		expect(uniqueIconId("star", new Set())).toBe("star");
		expect(uniqueIconId("star", new Set(["moon"]))).toBe("star");
	});

	test("被占用时从 -2 开始递增", () => {
		expect(uniqueIconId("star", new Set(["star"]))).toBe("star-2");
		expect(uniqueIconId("star", new Set(["star", "star-2"]))).toBe(
			"star-3",
		);
	});

	test("跳过中间已占用的编号", () => {
		expect(
			uniqueIconId("star", new Set(["star", "star-2", "star-3"])),
		).toBe("star-4");
	});

	test("同批次连续调用不会撞名（调用方回填 taken）", () => {
		const taken = new Set(["star"]);
		const first = uniqueIconId("star", taken);
		taken.add(first);
		const second = uniqueIconId("star", taken);
		expect(first).toBe("star-2");
		expect(second).toBe("star-3");
	});

	test("已有 -2 后缀的名字照常处理", () => {
		expect(uniqueIconId("star-2", new Set(["star-2"]))).toBe("star-2-2");
	});
});
