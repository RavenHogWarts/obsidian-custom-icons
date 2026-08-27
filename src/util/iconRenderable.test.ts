import { alwaysRenderable, buildIconRenderable } from "./iconRenderable";

/** 注册表里有内置 lucide、一个用户 SVG、一个 mdi 包图标 */
const REGISTRY = [
	"lucide-sun",
	"CI-我的图标",
	"CI-mdi-home",
];

const deps = (
	ids: string[] = REGISTRY,
	lucideNames: string[] = ["sun", "moon", "some-new-icon"],
) => ({
	getIconIds: () => ids,
	hasLucide: (name: string) => lucideNames.includes(name),
});

describe("alwaysRenderable", () => {
	it("一律为真（纯函数单测的默认值）", () => {
		expect(alwaysRenderable("whatever", "svg")).toBe(true);
		expect(alwaysRenderable(undefined, undefined)).toBe(true);
	});
});

describe("buildIconRenderable", () => {
	it("空图标名一律画不出来", () => {
		const canRender = buildIconRenderable(deps());
		expect(canRender("", "svg")).toBe(false);
		expect(canRender(undefined, "lucide")).toBe(false);
	});

	it("lucide 走 lucide-react，不查注册表", () => {
		const canRender = buildIconRenderable(deps());
		expect(canRender("sun", "lucide")).toBe(true);
		// 差集图标：注册表里没有 lucide-some-new-icon，但 lucide-react 里有，
		// setIcon 的 lucide 分支现场渲染得出来，所以必须判为可渲染
		expect(canRender("some-new-icon", "lucide")).toBe(true);
		expect(canRender("not-a-lucide-icon", "lucide")).toBe(false);
	});

	it("svg 先按原样查注册表，再补 CI- 前缀查一次", () => {
		const canRender = buildIconRenderable(deps());
		// 包图标：覆盖表里存的就是全 id
		expect(canRender("CI-mdi-home", "svg")).toBe(true);
		// 用户 SVG：覆盖表里可能存裸 id，注册表里是 CI- 形态
		expect(canRender("我的图标", "svg")).toBe(true);
		expect(canRender("CI-我的图标", "svg")).toBe(true);
	});

	it("图标包被停用后，它的图标判为画不出来", () => {
		// 停用 = CustomIconLibHandler.cleanupPack 把该包全部 removeIcon，
		// 于是这一轮新建的注册表快照里没有它了
		const canRender = buildIconRenderable(
			deps(["lucide-sun", "CI-我的图标"]),
		);
		expect(canRender("CI-mdi-home", "svg")).toBe(false);
	});

	it("用户 SVG 被删后判为画不出来", () => {
		const canRender = buildIconRenderable(deps(["lucide-sun"]));
		expect(canRender("我的图标", "svg")).toBe(false);
		expect(canRender("CI-我的图标", "svg")).toBe(false);
	});

	it("注册表快照惰性建立且只建一次", () => {
		let calls = 0;
		const canRender = buildIconRenderable({
			getIconIds: () => {
				calls++;
				return REGISTRY;
			},
			hasLucide: () => true,
		});

		// 只判 lucide 时一次都不建（文件浏览器整棵树都是 lucide 时省掉上万条快照）
		canRender("sun", "lucide");
		canRender("moon", "lucide");
		expect(calls).toBe(0);

		// 首个 svg 判定触发建立，之后复用
		canRender("CI-mdi-home", "svg");
		canRender("CI-我的图标", "svg");
		canRender("别的", "svg");
		expect(calls).toBe(1);
	});

	it("type 缺失时按 svg 处理（覆盖表里 type 可选）", () => {
		const canRender = buildIconRenderable(deps());
		expect(canRender("CI-mdi-home", undefined)).toBe(true);
		expect(canRender("sun", undefined)).toBe(false);
	});
});
