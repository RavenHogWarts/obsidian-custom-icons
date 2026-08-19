import { iconifyIconToSvg, resolveIcon } from "./iconifyParse";

const json = {
	prefix: "test",
	width: 24,
	height: 24,
	icons: {
		"arrow-left": { body: "<path d='L'/>" },
		house: { body: "<path d='H'/>", width: 32, height: 32 },
		rotated: { body: "<path d='R'/>", rotate: 1 as const },
	},
	aliases: {
		"arrow-right": { parent: "arrow-left", hFlip: true },
		home: { parent: "house" },
		"arrow-left-alias": { parent: "arrow-left", hFlip: true },
		// 循环引用
		"a": { parent: "b" },
		"b": { parent: "a" },
	},
};

describe("resolveIcon", () => {
	test("真实图标：继承集根级尺寸", () => {
		const icon = resolveIcon(json, "arrow-left");
		expect(icon).not.toBeNull();
		expect(icon?.body).toBe("<path d='L'/>");
		expect(icon?.width).toBe(24);
		expect(icon?.height).toBe(24);
	});

	test("真实图标：自身尺寸覆盖根级", () => {
		const icon = resolveIcon(json, "house");
		expect(icon?.width).toBe(32);
		expect(icon?.height).toBe(32);
	});

	test("别名：解链取 parent body", () => {
		const icon = resolveIcon(json, "home");
		expect(icon?.body).toBe("<path d='H'/>");
		expect(icon?.width).toBe(32); // 别名继承解析后的父级尺寸
	});

	test("别名：变换合并（hFlip）", () => {
		const icon = resolveIcon(json, "arrow-right");
		expect(icon?.hFlip).toBe(true);
		expect(icon?.body).toBe("<path d='L'/>");
	});

	test("别名：两次翻转抵消", () => {
		// arrow-left-alias 本身 hFlip，父级无翻转 → true
		expect(resolveIcon(json, "arrow-left-alias")?.hFlip).toBe(true);
	});

	test("缺失图标与循环引用返回 null", () => {
		expect(resolveIcon(json, "missing")).toBeNull();
		expect(resolveIcon(json, "a")).toBeNull();
	});
});

describe("iconifyIconToSvg", () => {
	test("无变换：viewBox 由尺寸与偏移组成", () => {
		const svg = iconifyIconToSvg(resolveIcon(json, "house")!);
		expect(svg).toBe(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d=\'H\'/></svg>',
		);
	});

	test("hFlip：水平翻转包裹 <g>", () => {
		const svg = iconifyIconToSvg(resolveIcon(json, "arrow-right")!);
		expect(svg).toContain("translate(24 0) scale(-1 1)");
		expect(svg).toContain("<path d='L'/>");
	});

	test("rotate：绕中心旋转包裹 <g>", () => {
		const svg = iconifyIconToSvg(resolveIcon(json, "rotated")!);
		expect(svg).toContain("rotate(90 12 12)");
	});
});
