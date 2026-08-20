import {
	findNearestConfiguredAncestor,
	getCompoundExtension,
	getExtension,
	IFileExplorerConfig,
	migrateFileExplorerPaths,
	normalizeExtensionKey,
	parseExtensionInput,
	resolveFileIcon,
	resolveFolderIcon,
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

describe("parseExtensionInput", () => {
	it("splits on commas and whitespace, normalizes and dedupes", () => {
		expect(parseExtensionInput(".xdb .js")).toEqual(["xdb", "js"]);
		expect(parseExtensionInput(".xdb,.js , md")).toEqual([
			"xdb",
			"js",
			"md",
		]);
		expect(parseExtensionInput("md, MD ,  .md")).toEqual(["md"]);
	});

	it("keeps a compound suffix as a single token", () => {
		expect(parseExtensionInput(".excalidraw.md")).toEqual(["excalidraw.md"]);
	});

	it("returns an empty array for blank input", () => {
		expect(parseExtensionInput("   ")).toEqual([]);
		expect(parseExtensionInput(",, ")).toEqual([]);
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
