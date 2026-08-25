import { ICustomSVGIcon } from "@src/types/types";
import {
	GROUP_NAME_MAX,
	UNGROUPED,
	assignGroup,
	countUngrouped,
	deleteGroupWithIcons,
	dissolveGroup,
	encodeSvgGroupPref,
	filterByGroup,
	groupMemberIds,
	iconGroup,
	listSvgGroups,
	normalizeGroupName,
	normalizeSvgGroup,
	renameGroup,
} from "./svgGroups";

/** 简写：`icon("sun", "weather")`；省略组名 = 未分组 */
const icon = (id: string, group?: string): ICustomSVGIcon => ({
	id,
	content: "<svg/>",
	...(group === undefined ? {} : { group }),
});

/** 每次调用重新构造，用于「不改动入参」的对照（JSON 深拷贝会退化成 any） */
const makeLib = (): ICustomSVGIcon[] => [
	icon("sun", "weather"),
	icon("rain", "weather"),
	icon("github", "brands"),
	icon("loose"),
];

const LIB: ICustomSVGIcon[] = makeLib();

describe("normalizeGroupName", () => {
	test("trim 两端空白", () => {
		expect(normalizeGroupName("  weather  ")).toBe("weather");
	});

	test("全空白视为未分组（不允许造出名为空白的组）", () => {
		expect(normalizeGroupName("   ")).toBe("");
		expect(normalizeGroupName("")).toBe("");
	});

	test("非字符串一律当未分组（data.json 可手改）", () => {
		expect(normalizeGroupName(undefined)).toBe("");
		expect(normalizeGroupName(null)).toBe("");
		expect(normalizeGroupName(42)).toBe("");
		expect(normalizeGroupName({ name: "weather" })).toBe("");
		expect(normalizeGroupName(["weather"])).toBe("");
	});

	test("超长截断到上限", () => {
		expect(normalizeGroupName("x".repeat(200))).toHaveLength(GROUP_NAME_MAX);
	});

	test("不改大小写", () => {
		expect(normalizeGroupName("Weather")).toBe("Weather");
		expect(normalizeGroupName("WEATHER")).toBe("WEATHER");
	});
});

describe("iconGroup", () => {
	test("字段缺失 / 脏值都归一为未分组", () => {
		expect(iconGroup(icon("a"))).toBe("");
		expect(iconGroup(icon("b", "  "))).toBe("");
		expect(
			iconGroup({ id: "c", content: "<svg/>", group: 7 as never }),
		).toBe("");
	});
});

describe("listSvgGroups", () => {
	test("按名称序列出非空组并计数", () => {
		expect(listSvgGroups(LIB)).toEqual([
			{ name: "brands", count: 1 },
			{ name: "weather", count: 2 },
		]);
	});

	test("未分组不成组", () => {
		expect(listSvgGroups([icon("a"), icon("b", "  ")])).toEqual([]);
	});

	// 只断言"是两个独立的组"，不锁死它们的先后：localeCompare 对纯大小写差异的
	// 平局顺序由 ICU 决定，写死会让测试跟着运行环境的 ICU 版本飘
	test("大小写不同是两个组", () => {
		const groups = listSvgGroups([
			icon("a", "Weather"),
			icon("b", "weather"),
		]);
		expect(groups).toHaveLength(2);
		expect(groups).toEqual(
			expect.arrayContaining([
				{ name: "Weather", count: 1 },
				{ name: "weather", count: 1 },
			]),
		);
	});

	test("空库返回空列表", () => {
		expect(listSvgGroups([])).toEqual([]);
	});
});

describe("countUngrouped", () => {
	test("只数未分组的", () => {
		expect(countUngrouped(LIB)).toBe(1);
		expect(countUngrouped([icon("a", "x"), icon("b", "y")])).toBe(0);
		expect(countUngrouped([icon("a"), icon("b", "   ")])).toBe(2);
	});
});

describe("filterByGroup", () => {
	test("null = 全部", () => {
		expect(filterByGroup(LIB, null)).toHaveLength(4);
	});

	test("空串 = 仅未分组", () => {
		expect(filterByGroup(LIB, "").map((i) => i.id)).toEqual(["loose"]);
	});

	test("组名 = 精确匹配", () => {
		expect(filterByGroup(LIB, "weather").map((i) => i.id)).toEqual([
			"sun",
			"rain",
		]);
	});

	test("区分大小写：weather 不匹配 Weather", () => {
		const lib = [icon("a", "Weather"), icon("b", "weather")];
		expect(filterByGroup(lib, "weather").map((i) => i.id)).toEqual(["b"]);
		expect(filterByGroup(lib, "Weather").map((i) => i.id)).toEqual(["a"]);
	});

	test("不存在的组返回空", () => {
		expect(filterByGroup(LIB, "nope")).toEqual([]);
	});

	test("不改动入参", () => {
		const original = [...LIB];
		filterByGroup(LIB, "weather");
		expect(LIB).toEqual(original);
	});
});

describe("assignGroup", () => {
	test("把指定 id 移入某组", () => {
		const next = assignGroup(LIB, new Set(["loose"]), "weather");
		expect(iconGroup(next.find((i) => i.id === "loose")!)).toBe("weather");
	});

	test("空串 = 移出分组，且不留空字段", () => {
		const next = assignGroup(LIB, new Set(["sun"]), "");
		const moved = next.find((i) => i.id === "sun")!;
		expect(iconGroup(moved)).toBe("");
		expect("group" in moved).toBe(false);
	});

	test("组名先 trim 再写入", () => {
		const next = assignGroup(LIB, new Set(["loose"]), "  icons  ");
		expect(iconGroup(next.find((i) => i.id === "loose")!)).toBe("icons");
	});

	test("未选中的图标原样保留（同一对象身份）", () => {
		const next = assignGroup(LIB, new Set(["loose"]), "weather");
		expect(next.find((i) => i.id === "github")).toBe(
			LIB.find((i) => i.id === "github"),
		);
	});

	test("已在目标组的图标不产生新对象", () => {
		const next = assignGroup(LIB, new Set(["sun"]), "weather");
		expect(next.find((i) => i.id === "sun")).toBe(
			LIB.find((i) => i.id === "sun"),
		);
	});

	test("选区里不存在的 id 直接跳过", () => {
		expect(assignGroup(LIB, new Set(["ghost"]), "weather")).toEqual(LIB);
	});

	test("空选区不改变任何东西", () => {
		expect(assignGroup(LIB, new Set(), "weather")).toEqual(LIB);
	});

	test("不改动入参", () => {
		assignGroup(LIB, new Set(["sun", "loose"]), "moved");
		expect(LIB).toEqual(makeLib());
	});
});

describe("renameGroup", () => {
	test("改写整组成员的字段", () => {
		const next = renameGroup(LIB, "weather", "climate");
		expect(listSvgGroups(next)).toEqual([
			{ name: "brands", count: 1 },
			{ name: "climate", count: 2 },
		]);
	});

	test("目标组已存在 = 合并", () => {
		const next = renameGroup(LIB, "brands", "weather");
		expect(listSvgGroups(next)).toEqual([{ name: "weather", count: 3 }]);
	});

	test("目标为空 = 整组移出分组", () => {
		const next = renameGroup(LIB, "weather", "");
		expect(listSvgGroups(next)).toEqual([{ name: "brands", count: 1 }]);
		expect(countUngrouped(next)).toBe(3);
	});

	test("源组为空名时什么都不做（未分组不是一个可重命名的组）", () => {
		expect(renameGroup(LIB, "", "x")).toEqual(LIB);
		expect(renameGroup(LIB, "   ", "x")).toEqual(LIB);
	});

	test("源组不存在时无影响", () => {
		expect(renameGroup(LIB, "nope", "x")).toEqual(LIB);
	});

	test("区分大小写：改 weather 不动 Weather", () => {
		const lib = [icon("a", "Weather"), icon("b", "weather")];
		const next = renameGroup(lib, "weather", "climate");
		// 同上，不锁大小写平局顺序
		expect(listSvgGroups(next)).toEqual(
			expect.arrayContaining([
				{ name: "Weather", count: 1 },
				{ name: "climate", count: 1 },
			]),
		);
		expect(iconGroup(next.find((i) => i.id === "a")!)).toBe("Weather");
	});

	test("不改动入参", () => {
		renameGroup(LIB, "weather", "climate");
		expect(LIB).toEqual(makeLib());
	});
});

describe("groupMemberIds", () => {
	test("列出该组全部成员", () => {
		expect(groupMemberIds(LIB, "weather")).toEqual(
			new Set(["sun", "rain"]),
		);
	});

	test("组不存在时为空集", () => {
		expect(groupMemberIds(LIB, "nope")).toEqual(new Set());
	});

	test("空组名为空集（未分组不是一个可操作的组）", () => {
		expect(groupMemberIds(LIB, "")).toEqual(new Set());
		expect(groupMemberIds(LIB, "   ")).toEqual(new Set());
	});

	test("区分大小写", () => {
		const lib = [icon("a", "Weather"), icon("b", "weather")];
		expect(groupMemberIds(lib, "weather")).toEqual(new Set(["b"]));
	});
});

describe("dissolveGroup", () => {
	test("成员留下、变成未分组", () => {
		const next = dissolveGroup(LIB, "weather");
		expect(next).toHaveLength(LIB.length);
		expect(listSvgGroups(next)).toEqual([{ name: "brands", count: 1 }]);
		// 原本 1 个未分组 + 解散进来的 2 个
		expect(countUngrouped(next)).toBe(3);
	});

	test("组不存在时无影响", () => {
		expect(dissolveGroup(LIB, "nope")).toEqual(LIB);
	});

	test("空组名什么都不做", () => {
		expect(dissolveGroup(LIB, "")).toEqual(LIB);
	});

	test("不改动入参", () => {
		dissolveGroup(LIB, "weather");
		expect(LIB).toEqual(makeLib());
	});
});

describe("deleteGroupWithIcons", () => {
	test("连图标一起删掉", () => {
		const next = deleteGroupWithIcons(LIB, "weather");
		expect(next.map((i) => i.id)).toEqual(["github", "loose"]);
	});

	test("不碰其它组与未分组", () => {
		const next = deleteGroupWithIcons(LIB, "weather");
		expect(listSvgGroups(next)).toEqual([{ name: "brands", count: 1 }]);
		expect(countUngrouped(next)).toBe(1);
	});

	test("组不存在时无影响", () => {
		expect(deleteGroupWithIcons(LIB, "nope")).toEqual(LIB);
	});

	test("空组名不删任何东西（不能误伤全部未分组图标）", () => {
		expect(deleteGroupWithIcons(LIB, "")).toEqual(LIB);
		expect(deleteGroupWithIcons(LIB, "   ")).toEqual(LIB);
	});

	test("区分大小写：删 weather 不动 Weather", () => {
		const lib = [icon("a", "Weather"), icon("b", "weather")];
		expect(deleteGroupWithIcons(lib, "weather").map((i) => i.id)).toEqual([
			"a",
		]);
	});

	test("不改动入参", () => {
		deleteGroupWithIcons(LIB, "weather");
		expect(LIB).toEqual(makeLib());
	});
});

describe("normalizeSvgGroup", () => {
	const available = ["brands", "weather"];

	test("未落盘 / 脏值 → 全部", () => {
		expect(normalizeSvgGroup(undefined, available)).toBeNull();
		expect(normalizeSvgGroup(null, available)).toBeNull();
		expect(normalizeSvgGroup(42, available)).toBeNull();
	});

	test("存在的组名照常保留", () => {
		expect(normalizeSvgGroup("weather", available)).toBe("weather");
	});

	test("已消失的组 → 回落到全部", () => {
		expect(normalizeSvgGroup("gone", available)).toBeNull();
	});

	test("大小写不符视为已消失", () => {
		expect(normalizeSvgGroup("Weather", available)).toBeNull();
	});

	// 「仅未分组」不落盘：空串一律解读为「全部」，重开视图回到全部
	test("空串 → 全部", () => {
		expect(normalizeSvgGroup("", available)).toBeNull();
		expect(normalizeSvgGroup("   ", available)).toBeNull();
	});

	test("一个组都没有时任何组名都回落", () => {
		expect(normalizeSvgGroup("weather", [])).toBeNull();
	});
});

describe("encodeSvgGroupPref", () => {
	test("全部与仅未分组都落成空串", () => {
		expect(encodeSvgGroupPref(null)).toBe("");
		expect(encodeSvgGroupPref(UNGROUPED)).toBe("");
	});

	test("组名原样落盘（先 trim）", () => {
		expect(encodeSvgGroupPref("weather")).toBe("weather");
		expect(encodeSvgGroupPref("  weather  ")).toBe("weather");
	});

	test("与 normalizeSvgGroup 往返一致", () => {
		const available = ["weather"];
		expect(
			normalizeSvgGroup(encodeSvgGroupPref("weather"), available),
		).toBe("weather");
		expect(normalizeSvgGroup(encodeSvgGroupPref(null), available)).toBeNull();
	});
});
