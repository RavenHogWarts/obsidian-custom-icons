import { IFileExplorerIconOverride } from "@src/types/types";
import {
	ExtensionMap,
	assignGroup,
	deleteGroupWithRules,
	dissolveGroup,
	groupMembers,
	listGroups,
	renameGroup,
	ruleGroup,
	setGroupColor,
	setGroupIcon,
	ungroupedKeys,
	uniformIcon,
} from "./extensionGroups";

/** 简写：`rule("png", "image", "file-image")`；省略组名 = 未分组 */
const rule = (
	ext: string,
	group?: string,
	icon = "image",
	color = "",
): IFileExplorerIconOverride => ({
	id: ext,
	icon,
	type: "lucide",
	color,
	...(group === undefined ? {} : { group }),
});

/** 每次调用重新构造，用于「不改动入参」的对照 */
const makeMap = (): ExtensionMap => ({
	png: rule("png", "图片"),
	jpg: rule("jpg", "图片"),
	mp4: rule("mp4", "视频", "film"),
	canvas: rule("canvas", undefined, "layout"),
});

describe("ruleGroup", () => {
	test("缺失 / 脏值 / 全空白都归一为未分组", () => {
		expect(ruleGroup(rule("a"))).toBe("");
		expect(ruleGroup(rule("a", "   "))).toBe("");
		expect(
			ruleGroup({ id: "a", group: 42 } as unknown as IFileExplorerIconOverride),
		).toBe("");
	});

	test("保留原大小写（Image 与 image 是两个组）", () => {
		expect(ruleGroup(rule("a", "Image"))).toBe("Image");
	});
});

describe("listGroups", () => {
	// 只断言集合与计数，不断言顺序：实现用 `localeCompare`，中文的相对次序取决于
	// 运行环境的 ICU 数据（Node 的 small-icu 与完整 ICU 结果不同），断言它等于
	// 断言测试机的构建选项
	test("列出非空组并计数", () => {
		expect(new Set(listGroups(makeMap()))).toEqual(
			new Set([
				{ name: "图片", count: 2 },
				{ name: "视频", count: 1 },
			]),
		);
	});

	test("按名称序排列", () => {
		expect(
			listGroups({
				b: rule("b", "beta"),
				c: rule("c", "gamma"),
				a: rule("a", "alpha"),
			}).map((g) => g.name),
		).toEqual(["alpha", "beta", "gamma"]);
	});

	test("空组不存在（没有成员就不出现）", () => {
		expect(listGroups({ canvas: rule("canvas") })).toEqual([]);
		expect(listGroups({})).toEqual([]);
	});
});

describe("groupMembers / ungroupedKeys", () => {
	test("取出组内成员", () => {
		expect(groupMembers(makeMap(), "图片").sort()).toEqual(["jpg", "png"]);
	});

	test("空组名返回空集，不误伤所有未分组规则", () => {
		expect(groupMembers(makeMap(), "")).toEqual([]);
		expect(groupMembers(makeMap(), "   ")).toEqual([]);
	});

	test("未分组键单独取", () => {
		expect(ungroupedKeys(makeMap())).toEqual(["canvas"]);
	});
});

describe("assignGroup", () => {
	test("移入分组", () => {
		const next = assignGroup(makeMap(), ["canvas"], "图片");
		expect(next.canvas.group).toBe("图片");
		expect(groupMembers(next, "图片").sort()).toEqual([
			"canvas",
			"jpg",
			"png",
		]);
	});

	test("移出分组时删掉字段，不留空串", () => {
		const next = assignGroup(makeMap(), ["png"], "");
		expect("group" in next.png).toBe(false);
		expect(ungroupedKeys(next).sort()).toEqual(["canvas", "png"]);
	});

	test("不在 map 里的扩展名被跳过，不新建条目", () => {
		const next = assignGroup(makeMap(), ["nope"], "图片");
		expect(next.nope).toBeUndefined();
		expect(Object.keys(next).sort()).toEqual(Object.keys(makeMap()).sort());
	});

	test("不改动入参", () => {
		const map = makeMap();
		assignGroup(map, ["canvas"], "图片");
		expect(map).toEqual(makeMap());
	});

	test("图标与颜色原样保留（只动归属）", () => {
		const next = assignGroup(makeMap(), ["canvas"], "图片");
		expect(next.canvas.icon).toBe("layout");
	});
});

describe("renameGroup", () => {
	test("改写全部成员", () => {
		const next = renameGroup(makeMap(), "图片", "照片");
		expect(groupMembers(next, "照片").sort()).toEqual(["jpg", "png"]);
		expect(groupMembers(next, "图片")).toEqual([]);
	});

	test("改名到已存在的组名 = 合并", () => {
		const next = renameGroup(makeMap(), "视频", "图片");
		expect(groupMembers(next, "图片").sort()).toEqual([
			"jpg",
			"mp4",
			"png",
		]);
		expect(listGroups(next)).toEqual([{ name: "图片", count: 3 }]);
	});

	test("源组名为空时原样返回（拒绝把所有未分组规则收进一个组）", () => {
		const map = makeMap();
		expect(renameGroup(map, "", "图片")).toEqual(map);
	});
});

describe("dissolveGroup", () => {
	test("规则留下、图标留下，只是变成未分组", () => {
		const next = dissolveGroup(makeMap(), "图片");
		expect(next.png.icon).toBe("image");
		expect(next.jpg).toBeDefined();
		expect(ungroupedKeys(next).sort()).toEqual(["canvas", "jpg", "png"]);
		expect(listGroups(next)).toEqual([{ name: "视频", count: 1 }]);
	});
});

describe("deleteGroupWithRules", () => {
	test("连规则一起删掉", () => {
		const next = deleteGroupWithRules(makeMap(), "图片");
		expect(next.png).toBeUndefined();
		expect(next.jpg).toBeUndefined();
		expect(Object.keys(next).sort()).toEqual(["canvas", "mp4"]);
	});

	test("组不存在时原样返回拷贝", () => {
		const map = makeMap();
		const next = deleteGroupWithRules(map, "不存在");
		expect(next).toEqual(map);
		expect(next).not.toBe(map);
	});

	test("空组名不删任何东西", () => {
		const map = makeMap();
		expect(deleteGroupWithRules(map, "")).toEqual(map);
	});
});

describe("setGroupIcon", () => {
	test("扇出到整组，组外不动", () => {
		const next = setGroupIcon(makeMap(), "图片", "camera", "lucide");
		expect(next.png.icon).toBe("camera");
		expect(next.jpg.icon).toBe("camera");
		expect(next.mp4.icon).toBe("film");
		expect(next.canvas.icon).toBe("layout");
	});

	test("省略 color 时保留各成员原有颜色", () => {
		const map: ExtensionMap = {
			png: rule("png", "图片", "image", "#f00"),
			jpg: rule("jpg", "图片", "image", "#0f0"),
		};
		const next = setGroupIcon(map, "图片", "camera", "lucide");
		expect(next.png.color).toBe("#f00");
		expect(next.jpg.color).toBe("#0f0");
	});

	test("显式传空串 = 清除颜色", () => {
		const map: ExtensionMap = { png: rule("png", "图片", "image", "#f00") };
		expect(setGroupIcon(map, "图片", "camera", "lucide", "").png.color).toBe(
			"",
		);
	});

	test("归属不变", () => {
		const next = setGroupIcon(makeMap(), "图片", "camera", "lucide");
		expect(groupMembers(next, "图片").sort()).toEqual(["jpg", "png"]);
	});

	test("空组原样返回", () => {
		const map = makeMap();
		expect(setGroupIcon(map, "不存在", "x", "lucide")).toEqual(map);
	});
});

describe("setGroupColor", () => {
	test("只改颜色，各成员图标保持原样（组内混合时不被统一掉）", () => {
		const map: ExtensionMap = {
			png: rule("png", "图片", "image"),
			svg: rule("svg", "图片", "shapes"),
		};
		const next = setGroupColor(map, "图片", "#f00");
		expect(next.png).toMatchObject({ icon: "image", color: "#f00" });
		expect(next.svg).toMatchObject({ icon: "shapes", color: "#f00" });
	});

	test("组外不动", () => {
		const next = setGroupColor(makeMap(), "图片", "#f00");
		expect(next.mp4.color).toBe("");
		expect(next.canvas.color).toBe("");
	});

	test("空串 = 清除整组颜色", () => {
		const map: ExtensionMap = { png: rule("png", "图片", "image", "#f00") };
		expect(setGroupColor(map, "图片", "").png.color).toBe("");
	});

	test("组不存在时原样返回拷贝", () => {
		const map = makeMap();
		const next = setGroupColor(map, "不存在", "#f00");
		expect(next).toEqual(map);
		expect(next).not.toBe(map);
	});
});

describe("uniformIcon", () => {
	test("全组一致时报告 mixed: false", () => {
		expect(uniformIcon(makeMap(), "图片")).toEqual({
			mixed: false,
			icon: "image",
			type: "lucide",
			color: "",
		});
	});

	test("单独改过某个成员 → mixed: true", () => {
		const map = assignGroup(makeMap(), [], "");
		map.jpg = rule("jpg", "图片", "camera");
		expect(uniformIcon(map, "图片")?.mixed).toBe(true);
	});

	test("颜色不同也算混合（组行旁边就有颜色控件）", () => {
		const map: ExtensionMap = {
			png: rule("png", "图片", "image", "#f00"),
			jpg: rule("jpg", "图片", "image", "#0f0"),
		};
		expect(uniformIcon(map, "图片")?.mixed).toBe(true);
	});

	test("整组都还没配图标 → 一致且 icon 为空", () => {
		const map: ExtensionMap = {
			png: rule("png", "图片", ""),
			jpg: rule("jpg", "图片", ""),
		};
		expect(uniformIcon(map, "图片")).toEqual({
			mixed: false,
			icon: "",
			type: "lucide",
			color: "",
		});
	});

	test("组不存在返回 null（调用方不该渲染这一行）", () => {
		expect(uniformIcon(makeMap(), "不存在")).toBeNull();
		expect(uniformIcon(makeMap(), "")).toBeNull();
	});

	test("扇出之后重新变为一致", () => {
		const map = makeMap();
		map.jpg = rule("jpg", "图片", "camera");
		expect(uniformIcon(map, "图片")?.mixed).toBe(true);
		const fixed = setGroupIcon(map, "图片", "camera", "lucide", "");
		expect(uniformIcon(fixed, "图片")?.mixed).toBe(false);
	});
});

describe("组名当作值而非键", () => {
	test("__proto__ 作为普通组名处理，不污染任何对象", () => {
		const next = assignGroup(makeMap(), ["canvas"], "__proto__");
		expect(next.canvas.group).toBe("__proto__");
		expect(groupMembers(next, "__proto__")).toEqual(["canvas"]);
		expect(({} as Record<string, unknown>).canvas).toBeUndefined();
		expect(listGroups(next).map((g) => g.name)).toContain("__proto__");
	});
});
