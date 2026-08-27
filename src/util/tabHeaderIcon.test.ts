import { ITabHeaderIconOverride } from "@src/types/types";
import { buildTabKey, parseTabKey, resolveTabIcon } from "./tabHeaderIcon";

const tabOverride = (
	id: string,
	icon: string,
): ITabHeaderIconOverride => ({ id, icon, type: "lucide", color: "" });

describe("buildTabKey", () => {
	it("joins type and label with ::", () => {
		expect(buildTabKey("markdown", "春节.md")).toBe("markdown::春节.md");
		expect(buildTabKey("empty", "新标签页")).toBe("empty::新标签页");
	});

	it("trims both parts", () => {
		expect(buildTabKey(" markdown ", " note.md ")).toBe("markdown::note.md");
	});

	it("returns empty when either part is blank", () => {
		expect(buildTabKey("", "label")).toBe("");
		expect(buildTabKey("markdown", "")).toBe("");
		expect(buildTabKey("markdown", "   ")).toBe("");
	});
});

describe("parseTabKey", () => {
	it("splits on the first ::", () => {
		expect(parseTabKey("markdown::春节.md")).toEqual({
			dataType: "markdown",
			label: "春节.md",
		});
	});

	it("keeps :: inside the label intact", () => {
		expect(parseTabKey("markdown::a::b.md")).toEqual({
			dataType: "markdown",
			label: "a::b.md",
		});
	});

	it("returns null for keys without separator or with blank parts", () => {
		expect(parseTabKey("markdown")).toBeNull();
		expect(parseTabKey("::label")).toBeNull();
		expect(parseTabKey("markdown::")).toBeNull();
		expect(parseTabKey("")).toBeNull();
	});
});

describe("resolveTabIcon", () => {
	const tabs: Record<string, ITabHeaderIconOverride> = {
		"markdown::春节.md": tabOverride("markdown::春节.md", "star"),
	};
	const data: Record<string, ITabHeaderIconOverride> = {
		markdown: tabOverride("markdown", "file-text"),
	};

	it("prefers the per-tab override over the type override", () => {
		expect(resolveTabIcon(tabs, data, "markdown", "春节.md")).toMatchObject({
			id: "markdown::春节.md",
			icon: "star",
		});
	});

	it("falls back to the type override for unassigned tabs", () => {
		expect(resolveTabIcon(tabs, data, "markdown", "另一篇.md")).toMatchObject({
			id: "markdown",
			icon: "file-text",
		});
	});

	it("falls back to the type override when label is missing", () => {
		expect(resolveTabIcon(tabs, data, "markdown", null)).toMatchObject({
			id: "markdown",
			icon: "file-text",
		});
		expect(resolveTabIcon(tabs, data, "markdown", undefined)).toMatchObject({
			id: "markdown",
			icon: "file-text",
		});
	});

	it("returns null when both layers are unassigned", () => {
		expect(resolveTabIcon(tabs, data, "canvas", "x.canvas")).toBeNull();
		expect(resolveTabIcon(undefined, undefined, "markdown", "春节.md")).toBeNull();
	});

	it("skips an empty-icon tab override and uses the type layer", () => {
		expect(
			resolveTabIcon(
				{ "markdown::空.md": { id: "markdown::空.md" } },
				data,
				"markdown",
				"空.md",
			),
		).toMatchObject({ id: "markdown", icon: "file-text" });
	});

	describe("图标画不出来时级联继续往下（图标包被停用 / 图标被删）", () => {
		/** 假装 mdi 包被停用 */
		const canRender = (icon?: string, type?: string) =>
			Boolean(icon) && (type === "lucide" || !icon!.startsWith("CI-mdi-"));

		const deadTabs: Record<string, ITabHeaderIconOverride> = {
			"markdown::春节.md": {
				id: "markdown::春节.md",
				icon: "CI-mdi-star",
				type: "svg",
			},
		};

		it("失效的单标签覆盖回落到类型层", () => {
			// 不传判定时保持旧行为
			expect(
				resolveTabIcon(deadTabs, data, "markdown", "春节.md"),
			).toMatchObject({ icon: "CI-mdi-star" });
			expect(
				resolveTabIcon(deadTabs, data, "markdown", "春节.md", canRender),
			).toMatchObject({ id: "markdown", icon: "file-text" });
		});

		it("两级都失效则返回 null，原生图标恢复可见", () => {
			const deadData: Record<string, ITabHeaderIconOverride> = {
				markdown: { id: "markdown", icon: "CI-mdi-f", type: "svg" },
			};
			expect(
				resolveTabIcon(
					deadTabs,
					deadData,
					"markdown",
					"春节.md",
					canRender,
				),
			).toBeNull();
		});
	});
});
