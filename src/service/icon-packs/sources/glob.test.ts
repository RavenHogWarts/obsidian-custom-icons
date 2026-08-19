import { GlobMatcher } from "./glob";

describe("GlobMatcher", () => {
	test("字面量目录 + 单段通配", () => {
		const m = new GlobMatcher("icons/outline/*.svg");
		expect(m.test("icons/outline/home.svg")).toBe(true);
		expect(m.test("icons/filled/home.svg")).toBe(false);
		expect(m.test("icons/outline/home.png")).toBe(false);
		expect(m.test("icons/outline/sub/home.svg")).toBe(false);
		expect(m.literalPrefix).toBe("icons/outline");
		expect(m.deriveName("icons/outline/home.svg")).toBe("home");
	});

	test("花括号多选一（npm-svg 预设 FA 规则）", () => {
		const m = new GlobMatcher("svgs/{solid,regular,brands}/*.svg");
		expect(m.test("svgs/solid/star.svg")).toBe(true);
		expect(m.test("svgs/brands/github.svg")).toBe(true);
		expect(m.test("svgs/duotone/star.svg")).toBe(false);
		expect(m.test("svgs/solid/sub/star.svg")).toBe(false);
		expect(m.literalPrefix).toBe("svgs");
		expect(m.deriveName("svgs/solid/star.svg")).toBe("solid-star");
	});

	test("双星号递归匹配（remix 规则）", () => {
		const m = new GlobMatcher("icons/**/*.svg");
		expect(m.test("icons/a.svg")).toBe(true); // ** 匹配零层
		expect(m.test("icons/System/add-line.svg")).toBe(true);
		expect(m.test("icons/User & Faces/user-smile.svg")).toBe(true);
		expect(m.test("other/a.svg")).toBe(false);
		// 目录名含空格与 & 时折叠为连字符
		expect(m.deriveName("icons/User & Faces/user-smile.svg")).toBe(
			"user-faces-user-smile",
		);
	});

	test("根目录通配（bootstrap 规则）", () => {
		const m = new GlobMatcher("icons/*.svg");
		expect(m.test("icons/star.svg")).toBe(true);
		expect(m.test("icons/sub/star.svg")).toBe(false);
		expect(m.deriveName("icons/star.svg")).toBe("star");
	});

	test("数字目录（heroicons 规则）", () => {
		const m = new GlobMatcher("24/outline/*.svg");
		expect(m.test("24/outline/arrow-right.svg")).toBe(true);
		expect(m.literalPrefix).toBe("24/outline");
		expect(m.deriveName("24/outline/arrow-right.svg")).toBe("arrow-right");
	});

	test("尾部裸 ** 归一化为 **/*", () => {
		const m = new GlobMatcher("icons/**");
		expect(m.test("icons/a.svg")).toBe(true);
		expect(m.test("icons/x/a.svg")).toBe(true);
	});

	test("非法 glob 抛错", () => {
		expect(() => new GlobMatcher("")).toThrow();
		expect(() => new GlobMatcher("/")).toThrow();
	});
});
