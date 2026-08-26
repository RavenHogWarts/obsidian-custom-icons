import {
	isValidExtensionKey,
	normalizeExtensionKey,
} from "./fileExplorerIcon";
import {
	FILE_EXPLORER_PRESETS,
	findPreset,
	planPreset,
} from "./fileExplorerPresets";

describe("FILE_EXPLORER_PRESETS", () => {
	test("每条预设的扩展名都已归一且合法（否则会造出永不命中的死规则）", () => {
		for (const preset of FILE_EXPLORER_PRESETS) {
			for (const ext of preset.extensions) {
				expect(normalizeExtensionKey(ext)).toBe(ext);
				expect(isValidExtensionKey(ext)).toBe(true);
			}
		}
	});

	test("预设 id 唯一", () => {
		const ids = FILE_EXPLORER_PRESETS.map((p) => p.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	test("同一预设内不含重复扩展名", () => {
		for (const preset of FILE_EXPLORER_PRESETS) {
			expect(new Set(preset.extensions).size).toBe(
				preset.extensions.length,
			);
		}
	});

	test("findPreset 命中与未命中", () => {
		expect(findPreset("image")?.icon).toBe("image");
		expect(findPreset("nope")).toBeUndefined();
	});
});

describe("planPreset", () => {
	const preset = { id: "image" as const, icon: "image", extensions: ["png", "jpg"] };

	test("全新扩展名进 added", () => {
		const plan = planPreset(
			preset,
			() => false,
			() => "",
			"图片",
		);
		expect(plan).toEqual({ added: ["png", "jpg"], skipped: [], adopted: [] });
	});

	test("已存在但未分组 → adopted（并入本组，保留其现有图标）", () => {
		const plan = planPreset(
			preset,
			(ext) => ext === "png",
			() => "",
			"图片",
		);
		expect(plan.adopted).toEqual(["png"]);
		expect(plan.added).toEqual(["jpg"]);
	});

	test("已属于别的分组 → skipped（不抢别人组里的成员）", () => {
		const plan = planPreset(
			preset,
			(ext) => ext === "png",
			(ext) => (ext === "png" ? "我的图" : ""),
			"图片",
		);
		expect(plan.skipped).toEqual(["png"]);
		expect(plan.added).toEqual(["jpg"]);
		expect(plan.adopted).toEqual([]);
	});

	test("已在目标组里 → adopted 而非 skipped（重复创建同一预设是幂等的）", () => {
		const plan = planPreset(
			preset,
			() => true,
			() => "图片",
			"图片",
		);
		expect(plan.adopted).toEqual(["png", "jpg"]);
		expect(plan.skipped).toEqual([]);
		expect(plan.added).toEqual([]);
	});
});
