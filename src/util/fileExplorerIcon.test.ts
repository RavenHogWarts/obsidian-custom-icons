import {
	getExtension,
	IFileExplorerConfig,
	migrateFileExplorerPaths,
	normalizeExtensionKey,
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
