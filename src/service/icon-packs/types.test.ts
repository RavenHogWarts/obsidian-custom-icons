import { packIconId, validatePackId } from "./types";

describe("validatePackId", () => {
	test("合法 id", () => {
		expect(validatePackId("fa")).toBeNull();
		expect(validatePackId("tabler-outline")).toBeNull();
		expect(validatePackId("bi2")).toBeNull();
	});

	test("保留字", () => {
		expect(validatePackId("ci")).toBe("reserved");
		expect(validatePackId("CI")).toBe("reserved");
		expect(validatePackId("ci-custom")).toBe("reserved");
	});

	test("lucide 不再是保留字（Iconify 官方 lucide 集要装得上）", () => {
		// 注册出来是 CI-lucide-<name>，与内置 lucide-<name> 前缀不同、不冲突
		expect(validatePackId("lucide")).toBeNull();
		expect(validatePackId("Lucide")).toBeNull();
	});

	test("非法格式", () => {
		expect(validatePackId("")).toBe("invalid");
		expect(validatePackId("1abc")).toBe("invalid");
		expect(validatePackId("-abc")).toBe("invalid");
		expect(validatePackId("abc-")).toBe("invalid");
		expect(validatePackId("a b")).toBe("invalid");
	});
});

describe("packIconId", () => {
	test("完整注册 id 带 CI- 前缀与包命名空间", () => {
		expect(packIconId("fa", "star")).toBe("CI-fa-star");
		expect(packIconId("tabler-outline", "home")).toBe(
			"CI-tabler-outline-home",
		);
	});
});
