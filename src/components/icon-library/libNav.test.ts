import { LIB_TAB_IDS, normalizeLibTab } from "./libNav";

describe("normalizeLibTab", () => {
	test("四个合法页签原样通过", () => {
		LIB_TAB_IDS.forEach((id) => {
			expect(normalizeLibTab(id)).toBe(id);
		});
	});

	test("脏值 / 缺失一律回落到「全部」页", () => {
		expect(normalizeLibTab(undefined)).toBe("all");
		expect(normalizeLibTab(null)).toBe("all");
		expect(normalizeLibTab("")).toBe("all");
		// 早期版本没有「全部」页，默认页是 pack；但拼写错误不该让整页空白
		expect(normalizeLibTab("packs")).toBe("all");
		expect(normalizeLibTab("Lucide")).toBe("all");
		expect(normalizeLibTab(0)).toBe("all");
		expect(normalizeLibTab(["svg"])).toBe("all");
	});
});
