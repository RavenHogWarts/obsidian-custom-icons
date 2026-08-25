import {
	ISvgLibraryExport,
	SVG_LIBRARY_EXPORT_VERSION,
	nextSvgSortMode,
	normalizeSvgSortMode,
	parseSvgLibrary,
	serializeSvgLibrary,
	sortSvgIcons,
	svgLibraryExportName,
} from "./svgLibrary";

describe("normalizeSvgSortMode", () => {
	test("合法值原样通过", () => {
		expect(normalizeSvgSortMode("name-asc")).toBe("name-asc");
		expect(normalizeSvgSortMode("name-desc")).toBe("name-desc");
		expect(normalizeSvgSortMode("added-desc")).toBe("added-desc");
	});

	test("脏值 / 缺失一律回落到 name-asc", () => {
		expect(normalizeSvgSortMode(undefined)).toBe("name-asc");
		expect(normalizeSvgSortMode(null)).toBe("name-asc");
		expect(normalizeSvgSortMode("")).toBe("name-asc");
		expect(normalizeSvgSortMode("added-asc")).toBe("name-asc");
		expect(normalizeSvgSortMode(1)).toBe("name-asc");
		expect(normalizeSvgSortMode({ mode: "name-desc" })).toBe("name-asc");
	});
});

describe("sortSvgIcons", () => {
	const icons = [
		{ id: "beta", content: "<svg/>", addedAt: 100 },
		{ id: "alpha", content: "<svg/>", addedAt: 300 },
		{ id: "gamma", content: "<svg/>", addedAt: 200 },
	];

	test("按名称升降序", () => {
		expect(sortSvgIcons(icons, "name-asc").map((i) => i.id)).toEqual([
			"alpha",
			"beta",
			"gamma",
		]);
		expect(sortSvgIcons(icons, "name-desc").map((i) => i.id)).toEqual([
			"gamma",
			"beta",
			"alpha",
		]);
	});

	test("最近添加：按 addedAt 倒序", () => {
		expect(sortSvgIcons(icons, "added-desc").map((i) => i.id)).toEqual([
			"alpha",
			"gamma",
			"beta",
		]);
	});

	test("旧数据无 addedAt 时按插入顺序倒序（越晚加的越靠前）", () => {
		const legacy = [
			{ id: "first", content: "<svg/>" },
			{ id: "second", content: "<svg/>" },
			{ id: "third", content: "<svg/>" },
		];
		expect(sortSvgIcons(legacy, "added-desc").map((i) => i.id)).toEqual([
			"third",
			"second",
			"first",
		]);
	});

	test("新旧混合：有时间戳的排在无时间戳的前面", () => {
		const mixed = [
			{ id: "legacy", content: "<svg/>" },
			{ id: "fresh", content: "<svg/>", addedAt: 1 },
		];
		expect(sortSvgIcons(mixed, "added-desc").map((i) => i.id)).toEqual([
			"fresh",
			"legacy",
		]);
	});

	test("不改动入参", () => {
		const original = [...icons];
		sortSvgIcons(icons, "name-asc");
		expect(icons).toEqual(original);
	});
});

describe("nextSvgSortMode", () => {
	test("三档循环", () => {
		expect(nextSvgSortMode("name-asc")).toBe("name-desc");
		expect(nextSvgSortMode("name-desc")).toBe("added-desc");
		expect(nextSvgSortMode("added-desc")).toBe("name-asc");
	});
});

describe("svgLibraryExportName", () => {
	test("含日期时间戳", () => {
		expect(svgLibraryExportName(new Date(2026, 7, 25, 9, 5, 3))).toBe(
			"custom-icons-20260825-090503.json",
		);
	});
});

describe("serializeSvgLibrary / parseSvgLibrary", () => {
	const icons = [{ id: "star", content: "<svg>a</svg>", addedAt: 7 }];

	test("往返一致", () => {
		expect(parseSvgLibrary(serializeSvgLibrary(icons))).toEqual(icons);
	});

	test("写入当前版本号", () => {
		const payload = JSON.parse(
			serializeSvgLibrary(icons),
		) as ISvgLibraryExport;
		expect(payload.version).toBe(SVG_LIBRARY_EXPORT_VERSION);
	});

	test("缺 version 视为 1（早期手写文件）", () => {
		expect(
			parseSvgLibrary('{"icons":[{"id":"a","content":"<svg/>"}]}'),
		).toEqual([{ id: "a", content: "<svg/>" }]);
	});

	test("逐条丢弃脏项，保留合法项", () => {
		const text = JSON.stringify({
			version: 1,
			icons: [
				{ id: "ok", content: "<svg/>" },
				{ id: "", content: "<svg/>" },
				{ id: "no-content", content: "   " },
				{ id: 42, content: "<svg/>" },
				null,
				"garbage",
			],
		});
		expect(parseSvgLibrary(text)).toEqual([
			{ id: "ok", content: "<svg/>" },
		]);
	});

	test("id / content 两端空白被 trim", () => {
		expect(
			parseSvgLibrary('{"icons":[{"id":" a ","content":" <svg/> "}]}'),
		).toEqual([{ id: "a", content: "<svg/>" }]);
	});

	test("结构不认识时返回 null", () => {
		expect(parseSvgLibrary("not json")).toBeNull();
		expect(parseSvgLibrary("[]")).toBeNull();
		expect(parseSvgLibrary('"text"')).toBeNull();
		expect(parseSvgLibrary("{}")).toBeNull();
		expect(parseSvgLibrary('{"icons":"nope"}')).toBeNull();
	});

	test("版本号高于当前实现时拒绝（避免误读未来格式）", () => {
		expect(parseSvgLibrary('{"version":99,"icons":[]}')).toBeNull();
	});

	test("合法但为空的 icons 数组返回空数组（不是 null）", () => {
		expect(parseSvgLibrary('{"version":1,"icons":[]}')).toEqual([]);
	});
});
