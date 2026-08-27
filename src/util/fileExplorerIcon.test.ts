import {
	findNearestConfiguredAncestor,
	getCompoundExtension,
	getExtension,
	IFileExplorerConfig,
	isValidExtensionKey,
	migrateFileExplorerPaths,
	normalizeExtensionKey,
	parseExtensionInput,
	resolveFileIcon,
	resolveFolderIcon,
	tallyExtensions,
} from "./fileExplorerIcon";

const emptyCfg: IFileExplorerConfig = {
	enable: true,
	folderDefault: { id: "", icon: "", type: "lucide", color: "" },
	folders: {},
	fileDefault: { id: "", icon: "", type: "lucide", color: "" },
	extensions: {},
	files: {},
	inherit: { subfolder: false, file: false },
};

describe("getExtension", () => {
	it("extracts lowercase extension", () => {
		expect(getExtension("YG/春节.MD")).toBe("md");
		expect(getExtension("Components/basic/test.xdb")).toBe("xdb");
		expect(getExtension("a/b/note.canvas")).toBe("canvas");
	});

	it("returns empty for no extension", () => {
		expect(getExtension("folder/name")).toBe("");
		expect(getExtension("noext")).toBe("");
	});

	it("returns empty for hidden dotfiles", () => {
		expect(getExtension(".gitignore")).toBe("");
		expect(getExtension("dir/.env")).toBe("");
	});

	it("uses the last dot", () => {
		expect(getExtension("a.b.tar.gz")).toBe("gz");
	});
});

describe("normalizeExtensionKey", () => {
	it("strips leading dots and lowercases", () => {
		expect(normalizeExtensionKey(".PDF")).toBe("pdf");
		expect(normalizeExtensionKey("  Md ")).toBe("md");
		expect(normalizeExtensionKey("..canvas")).toBe("canvas");
	});
});

describe("resolveFileIcon", () => {
	it("returns null when nothing matches", () => {
		expect(resolveFileIcon("YG/春节.md", emptyCfg)).toBeNull();
	});

	it("falls back to fileDefault", () => {
		const cfg: IFileExplorerConfig = {
			...emptyCfg,
			fileDefault: { id: "", icon: "file-text", type: "lucide", color: "" },
		};
		expect(resolveFileIcon("YG/春节.md", cfg)?.icon).toBe("file-text");
	});

	it("extension override beats fileDefault", () => {
		const cfg: IFileExplorerConfig = {
			...emptyCfg,
			fileDefault: { id: "", icon: "file-text", type: "lucide", color: "" },
			extensions: { canvas: { id: "canvas", icon: "layout", type: "lucide" } },
		};
		expect(resolveFileIcon("a/b.canvas", cfg)?.icon).toBe("layout");
		expect(resolveFileIcon("a/b.md", cfg)?.icon).toBe("file-text");
	});

	it("per-file override beats extension and default", () => {
		const cfg: IFileExplorerConfig = {
			...emptyCfg,
			fileDefault: { id: "", icon: "file-text", type: "lucide", color: "" },
			extensions: { md: { id: "md", icon: "file", type: "lucide" } },
			files: { "YG/春节.md": { id: "YG/春节.md", icon: "star", type: "lucide" } },
		};
		expect(resolveFileIcon("YG/春节.md", cfg)?.icon).toBe("star");
		expect(resolveFileIcon("YG/123.md", cfg)?.icon).toBe("file");
	});
});

describe("resolveFolderIcon", () => {
	it("returns null when nothing matches", () => {
		expect(resolveFolderIcon("Components", emptyCfg)).toBeNull();
	});

	it("folderDefault then per-folder override", () => {
		const cfg: IFileExplorerConfig = {
			...emptyCfg,
			folderDefault: { id: "", icon: "folder", type: "lucide", color: "" },
			folders: {
				Components: { id: "Components", icon: "box", type: "lucide" },
			},
		};
		expect(resolveFolderIcon("assets", cfg)?.icon).toBe("folder");
		expect(resolveFolderIcon("Components", cfg)?.icon).toBe("box");
	});
});

describe("migrateFileExplorerPaths", () => {
	it("renames a single file key", () => {
		const map = {
			"YG/春节.md": { id: "YG/春节.md", icon: "star", type: "lucide" as const },
		};
		const next = migrateFileExplorerPaths(map, "YG/春节.md", "YG/元宵.md", false);
		expect(next["YG/元宵.md"]).toEqual({
			id: "YG/元宵.md",
			icon: "star",
			type: "lucide",
		});
		expect(next["YG/春节.md"]).toBeUndefined();
	});

	it("migrates folder and its children on folder rename", () => {
		const map = {
			Components: { id: "Components", icon: "box", type: "lucide" as const },
			"Components/basic": {
				id: "Components/basic",
				icon: "folder",
				type: "lucide" as const,
			},
		};
		const next = migrateFileExplorerPaths(map, "Components", "Comp", true);
		expect(next["Comp"]?.id).toBe("Comp");
		expect(next["Comp/basic"]?.id).toBe("Comp/basic");
		expect(next["Components"]).toBeUndefined();
		expect(next["Components/basic"]).toBeUndefined();
	});

	it("returns the same reference when nothing changed", () => {
		const map = {
			"a.md": { id: "a.md", icon: "x", type: "lucide" as const },
		};
		expect(migrateFileExplorerPaths(map, "b.md", "c.md", false)).toBe(map);
	});
});

describe("getCompoundExtension", () => {
	it("takes everything after the first non-leading dot", () => {
		expect(getCompoundExtension("foo.excalidraw.md")).toBe("excalidraw.md");
		expect(getCompoundExtension("a/b/x.tar.gz")).toBe("tar.gz");
		expect(getCompoundExtension("note.md")).toBe("md");
	});

	it("returns empty when there is no compound suffix", () => {
		expect(getCompoundExtension(".gitignore")).toBe("");
		expect(getCompoundExtension("folder/name")).toBe("");
	});

	it("lowercases and handles backslash separators", () => {
		expect(getCompoundExtension("A\\B\\X.Excalidraw.MD")).toBe(
			"excalidraw.md",
		);
	});
});

describe("isValidExtensionKey", () => {
	it("accepts plain and compound suffixes", () => {
		expect(isValidExtensionKey("md")).toBe(true);
		expect(isValidExtensionKey("excalidraw.md")).toBe(true);
		expect(isValidExtensionKey("tar.gz")).toBe(true);
		expect(isValidExtensionKey("d-ts")).toBe(true);
		expect(isValidExtensionKey("my_ext")).toBe(true);
	});

	it("accepts non-ASCII extensions (a hard ASCII rule would reject valid config)", () => {
		expect(isValidExtensionKey("笔记")).toBe(true);
	});

	it("rejects keys outside getExtension's range (dead rules)", () => {
		expect(isValidExtensionKey("")).toBe(false);
		expect(isValidExtensionKey("photos/")).toBe(false);
		expect(isValidExtensionKey("a\\b")).toBe(false);
		expect(isValidExtensionKey("*.png")).toBe(false);
		expect(isValidExtensionKey("p?g")).toBe(false);
		expect(isValidExtensionKey("a b")).toBe(false);
	});

	it("rejects leading and trailing dots", () => {
		// 前导点在 normalizeExtensionKey 之后不该还剩；结尾点永远截不出来
		expect(isValidExtensionKey(".md")).toBe(false);
		expect(isValidExtensionKey("md.")).toBe(false);
	});
});

describe("normalizeExtensionKey glob correction", () => {
	it("strips a leading asterisk so *.png becomes png", () => {
		expect(normalizeExtensionKey("*.png")).toBe("png");
		expect(normalizeExtensionKey("*.PNG")).toBe("png");
	});

	it("leaves other illegal shapes alone (they are rejected, not silently fixed)", () => {
		expect(normalizeExtensionKey("Photos/")).toBe("photos/");
	});
});

describe("parseExtensionInput", () => {
	it("splits on commas and whitespace, normalizes and dedupes", () => {
		expect(parseExtensionInput(".xdb .js").keys).toEqual(["xdb", "js"]);
		expect(parseExtensionInput(".xdb,.js , md").keys).toEqual([
			"xdb",
			"js",
			"md",
		]);
		expect(parseExtensionInput("md, MD ,  .md").keys).toEqual(["md"]);
	});

	it("keeps a compound suffix as a single token", () => {
		expect(parseExtensionInput(".excalidraw.md").keys).toEqual([
			"excalidraw.md",
		]);
	});

	it("returns empty results for blank input", () => {
		expect(parseExtensionInput("   ")).toEqual({ keys: [], invalid: [] });
		expect(parseExtensionInput(",, ")).toEqual({ keys: [], invalid: [] });
	});

	it("corrects the glob form instead of rejecting it", () => {
		expect(parseExtensionInput("*.png *.jpg")).toEqual({
			keys: ["png", "jpg"],
			invalid: [],
		});
	});

	it("separates illegal tokens, returning them verbatim", () => {
		const result = parseExtensionInput("png Photos/ md");
		expect(result.keys).toEqual(["png", "md"]);
		// 原样回显（不是归一化后的 "photos/"）：用户要认出自己敲的是哪一个
		expect(result.invalid).toEqual(["Photos/"]);
	});
});

describe("tallyExtensions", () => {
	it("counts the trailing suffix", () => {
		const counts = tallyExtensions(["a.md", "b/c.md", "d.pdf"]);
		expect(counts.get("md")).toBe(2);
		expect(counts.get("pdf")).toBe(1);
	});

	it("counts a compound suffix in addition to the trailing one", () => {
		// resolveFileIcon 对这两个键各查一次，所以两边都得计——否则
		// excalidraw.md 永远不会出现在候选里
		const counts = tallyExtensions(["X.excalidraw.md", "plain.md"]);
		expect(counts.get("excalidraw.md")).toBe(1);
		expect(counts.get("md")).toBe(2);
	});

	it("does not double count when both suffixes are identical", () => {
		const counts = tallyExtensions(["note.md"]);
		expect(counts.get("md")).toBe(1);
	});

	it("ignores extensionless and hidden files", () => {
		const counts = tallyExtensions(["README", ".gitignore", "dir/.env"]);
		expect(counts.size).toBe(0);
	});

	it("lowercases keys so they line up with the stored map", () => {
		expect(tallyExtensions(["A.PNG"]).get("png")).toBe(1);
	});
});

describe("resolveFileIcon compound suffix", () => {
	it("compound extension beats plain extension", () => {
		const cfg: IFileExplorerConfig = {
			...emptyCfg,
			extensions: {
				md: { id: "md", icon: "file", type: "lucide" },
				"excalidraw.md": {
					id: "excalidraw.md",
					icon: "layout",
					type: "lucide",
				},
			},
		};
		expect(resolveFileIcon("X.excalidraw.md", cfg)?.icon).toBe("layout");
		expect(resolveFileIcon("plain.md", cfg)?.icon).toBe("file");
	});

	it("falls back to the plain extension when no compound rule exists", () => {
		const cfg: IFileExplorerConfig = {
			...emptyCfg,
			extensions: { md: { id: "md", icon: "file", type: "lucide" } },
		};
		expect(resolveFileIcon("X.excalidraw.md", cfg)?.icon).toBe("file");
	});
});

describe("findNearestConfiguredAncestor", () => {
	const folders = {
		A: { id: "A", icon: "box", type: "lucide" as const },
		"A/sub": { id: "A/sub", icon: "star", type: "lucide" as const },
		"A/empty": { id: "A/empty", icon: "", type: "lucide" as const },
	};

	it("returns the nearest configured ancestor (excluding self)", () => {
		expect(findNearestConfiguredAncestor("A/sub/leaf", folders)?.icon).toBe(
			"star",
		);
		expect(findNearestConfiguredAncestor("A/child", folders)?.icon).toBe(
			"box",
		);
	});

	it("skips ancestors that have no icon", () => {
		expect(
			findNearestConfiguredAncestor("A/empty/leaf", folders)?.icon,
		).toBe("box");
	});

	it("returns undefined at the vault root", () => {
		expect(findNearestConfiguredAncestor("A", folders)).toBeUndefined();
		expect(findNearestConfiguredAncestor("top", folders)).toBeUndefined();
	});
});

describe("inheritance", () => {
	const base: IFileExplorerConfig = {
		...emptyCfg,
		folders: {
			A: { id: "A", icon: "box", type: "lucide", color: "#f00" },
			"A/sub": { id: "A/sub", icon: "star", type: "lucide" },
		},
	};

	it("subfolder inherits the nearest ancestor only when enabled", () => {
		const off = { ...base, inherit: { subfolder: false, file: false } };
		expect(resolveFolderIcon("A/deep/child", off)).toBeNull();

		const on = { ...base, inherit: { subfolder: true, file: false } };
		expect(resolveFolderIcon("A/deep/child", on)?.icon).toBe("box");
	});

	it("a self override beats inheritance", () => {
		const on = { ...base, inherit: { subfolder: true, file: false } };
		expect(resolveFolderIcon("A/sub", on)?.icon).toBe("star");
	});

	it("inheritance carries the color", () => {
		const on = { ...base, inherit: { subfolder: true, file: false } };
		expect(resolveFolderIcon("A/deep/child", on)?.color).toBe("#f00");
	});

	it("file inherits its folder chain only when enabled", () => {
		const off = { ...base, inherit: { subfolder: false, file: false } };
		expect(resolveFileIcon("A/sub/note.md", off)).toBeNull();

		const on = { ...base, inherit: { subfolder: false, file: true } };
		expect(resolveFileIcon("A/sub/note.md", on)?.icon).toBe("star");
	});

	it("an extension rule beats file inheritance", () => {
		const cfg: IFileExplorerConfig = {
			...base,
			extensions: { md: { id: "md", icon: "file", type: "lucide" } },
			inherit: { subfolder: false, file: true },
		};
		expect(resolveFileIcon("A/sub/note.md", cfg)?.icon).toBe("file");
	});
});

describe("图标画不出来时级联继续往下（图标包被停用 / 图标被删）", () => {
	/** 假装 mdi 包被停用：它的图标一律画不出来，其余照常 */
	const canRender = (icon?: string, type?: string) =>
		Boolean(icon) && (type === "lucide" || !icon!.startsWith("CI-mdi-"));

	const cfg: IFileExplorerConfig = {
		...emptyCfg,
		folderDefault: { id: "", icon: "star", type: "lucide", color: "" },
		fileDefault: { id: "", icon: "file", type: "lucide", color: "" },
		folders: { Work: { id: "Work", icon: "CI-mdi-home", type: "svg" } },
		extensions: { md: { id: "md", icon: "CI-mdi-file", type: "svg" } },
		files: {
			"Work/a.md": { id: "Work/a.md", icon: "CI-mdi-doc", type: "svg" },
		},
	};

	it("文件夹：失效的单项覆盖回落到 folderDefault", () => {
		// 不传判定时保持旧行为——那条死引用照样赢下这一级
		expect(resolveFolderIcon("Work", cfg)?.icon).toBe("CI-mdi-home");
		expect(resolveFolderIcon("Work", cfg, canRender)?.icon).toBe("star");
	});

	it("文件：单项与扩展名两级都失效，一路落到 fileDefault", () => {
		expect(resolveFileIcon("Work/a.md", cfg, canRender)?.icon).toBe("file");
	});

	it("连兜底层都失效则返回 null——调用方据此移除图标节点，不留空白占位", () => {
		const dead: IFileExplorerConfig = {
			...cfg,
			folderDefault: { id: "", icon: "CI-mdi-x", type: "svg", color: "" },
		};
		expect(resolveFolderIcon("Work", dead, canRender)).toBeNull();
	});

	it("继承跳过失效的祖先，继续上溯到还画得出来的那个", () => {
		const inherit: IFileExplorerConfig = {
			...emptyCfg,
			inherit: { subfolder: true, file: false },
			folders: {
				A: { id: "A", icon: "box", type: "lucide" },
				"A/B": { id: "A/B", icon: "CI-mdi-dead", type: "svg" },
			},
		};
		expect(resolveFolderIcon("A/B/C", inherit, canRender)?.icon).toBe("box");
		expect(
			findNearestConfiguredAncestor("A/B/C", inherit.folders, canRender)
				?.icon,
		).toBe("box");
	});

	it("重新启用图标包后立刻恢复——设置从未被改写", () => {
		expect(resolveFolderIcon("Work", cfg, () => true)?.icon).toBe(
			"CI-mdi-home",
		);
	});
});
