import { ensureSvgNamespace } from "./sanitize";

const NS = 'xmlns="http://www.w3.org/2000/svg"';

describe("ensureSvgNamespace", () => {
	test("给缺失 xmlns 的根标签补上命名空间", () => {
		expect(ensureSvgNamespace('<svg viewBox="0 0 24 24"></svg>')).toBe(
			`<svg ${NS} viewBox="0 0 24 24"></svg>`,
		);
	});

	test("无属性的根标签同样可补", () => {
		expect(ensureSvgNamespace("<svg><path d=\"M0 0\"/></svg>")).toBe(
			`<svg ${NS}><path d="M0 0"/></svg>`,
		);
	});

	test("已声明 xmlns 时返回 null（无需改写）", () => {
		const withNs = `<svg ${NS}></svg>`;
		expect(ensureSvgNamespace(withNs)).toBeNull();
	});

	test("大小写与换行不影响识别", () => {
		expect(ensureSvgNamespace("<SVG\n  fill=\"none\"></SVG>")).toBe(
			`<SVG ${NS}\n  fill="none"></SVG>`,
		);
	});

	test("没有 svg 根标签时返回 null", () => {
		expect(ensureSvgNamespace("")).toBeNull();
		expect(ensureSvgNamespace("not svg at all")).toBeNull();
		expect(ensureSvgNamespace("<div></div>")).toBeNull();
	});

	test("不会把 <svgfoo> 误判为 svg 根标签", () => {
		expect(ensureSvgNamespace("<svgfoo></svgfoo>")).toBeNull();
	});

	test("只处理首个 <svg，嵌套 svg 保持原样", () => {
		expect(ensureSvgNamespace("<svg><svg></svg></svg>")).toBe(
			`<svg ${NS}><svg></svg></svg>`,
		);
	});
});
