import {
	BOOKMARK_KINDS,
	IBookmarksConfig,
	isBookmarkKind,
	resolveBookmarkIcon,
} from "./bookmarkIcon";

const emptyCfg: IBookmarksConfig = {
	enable: true,
	items: {},
	types: {},
};

describe("isBookmarkKind", () => {
	it("accepts the six known kinds", () => {
		expect(BOOKMARK_KINDS).toHaveLength(6);
		for (const kind of BOOKMARK_KINDS) {
			expect(isBookmarkKind(kind)).toBe(true);
		}
	});

	it("rejects unknown strings", () => {
		expect(isBookmarkKind("markdown")).toBe(false);
		expect(isBookmarkKind("")).toBe(false);
		expect(isBookmarkKind("__proto__")).toBe(false);
	});
});

describe("resolveBookmarkIcon", () => {
	it("returns null when nothing configured", () => {
		expect(resolveBookmarkIcon("123", "file", emptyCfg)).toBeNull();
	});

	it("falls back to the type default layer", () => {
		const cfg: IBookmarksConfig = {
			...emptyCfg,
			types: { file: { id: "file", icon: "file-text", type: "lucide" } },
		};
		const icon = resolveBookmarkIcon("123", "file", cfg);
		expect(icon).toMatchObject({ icon: "file-text", type: "lucide" });
	});

	it("prefers the per-item override over the type default", () => {
		const cfg: IBookmarksConfig = {
			...emptyCfg,
			items: { "123": { id: "123", icon: "star", type: "lucide" } },
			types: { file: { id: "file", icon: "file-text", type: "lucide" } },
		};
		const icon = resolveBookmarkIcon("123", "file", cfg);
		expect(icon).toMatchObject({ icon: "star" });
	});

	it("uses the type default for other kinds (group/search/graph)", () => {
		const cfg: IBookmarksConfig = {
			...emptyCfg,
			types: {
				group: { id: "group", icon: "folder", type: "lucide" },
			},
		};
		expect(resolveBookmarkIcon(undefined, "group", cfg)).toMatchObject({
			icon: "folder",
		});
		// a file row with no file-type default stays null
		expect(resolveBookmarkIcon("9", "file", cfg)).toBeNull();
	});

	it("skips the item layer when key is undefined", () => {
		const cfg: IBookmarksConfig = {
			...emptyCfg,
			items: { "123": { id: "123", icon: "star", type: "lucide" } },
			types: { url: { id: "url", icon: "globe", type: "lucide" } },
		};
		expect(resolveBookmarkIcon(undefined, "url", cfg)).toMatchObject({
			icon: "globe",
		});
	});

	it("treats an empty-icon override as unset", () => {
		const cfg: IBookmarksConfig = {
			...emptyCfg,
			items: { "123": { id: "123", icon: "", type: "lucide" } },
			types: { file: { id: "file", icon: "file-text", type: "lucide" } },
		};
		// empty item override → falls through to the type default
		expect(resolveBookmarkIcon("123", "file", cfg)).toMatchObject({
			icon: "file-text",
		});
	});

	it("normalizes the color of the resolved icon", () => {
		const cfg: IBookmarksConfig = {
			...emptyCfg,
			types: {
				file: {
					id: "file",
					icon: "file-text",
					type: "lucide",
					color: "#ffffff",
				},
			},
		};
		const icon = resolveBookmarkIcon("1", "file", cfg);
		expect(icon?.color).toBeTruthy();
	});

	describe("图标画不出来时级联继续往下（图标包被停用 / 图标被删）", () => {
		/** 假装 mdi 包被停用 */
		const canRender = (icon?: string, type?: string) =>
			Boolean(icon) && (type === "lucide" || !icon!.startsWith("CI-mdi-"));

		const cfg: IBookmarksConfig = {
			...emptyCfg,
			items: { "123": { id: "123", icon: "CI-mdi-star", type: "svg" } },
			types: { file: { id: "file", icon: "file-text", type: "lucide" } },
		};

		it("失效的单项覆盖回落到类型层", () => {
			// 不传判定时保持旧行为
			expect(resolveBookmarkIcon("123", "file", cfg)).toMatchObject({
				icon: "CI-mdi-star",
			});
			expect(
				resolveBookmarkIcon("123", "file", cfg, canRender),
			).toMatchObject({ icon: "file-text" });
		});

		it("两级都失效则返回 null，原生图标恢复可见", () => {
			const dead: IBookmarksConfig = {
				...cfg,
				types: { file: { id: "file", icon: "CI-mdi-f", type: "svg" } },
			};
			expect(resolveBookmarkIcon("123", "file", dead, canRender)).toBeNull();
		});
	});
});
