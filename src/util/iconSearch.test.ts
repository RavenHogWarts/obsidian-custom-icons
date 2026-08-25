import { isSubsequence, rankIcons } from "./iconSearch";

describe("isSubsequence", () => {
	test("按序出现即命中（不要求连续）", () => {
		expect(isSubsequence("home", "hme")).toBe(true);
		expect(isSubsequence("arrow-up-az", "aup")).toBe(true);
	});

	test("顺序不符或字符缺失时不命中", () => {
		expect(isSubsequence("home", "emoh")).toBe(false);
		expect(isSubsequence("home", "homex")).toBe(false);
	});

	test("空串命中任意串；needle 长于 haystack 直接否", () => {
		expect(isSubsequence("home", "")).toBe(true);
		expect(isSubsequence("ab", "abc")).toBe(false);
	});
});

describe("rankIcons", () => {
	const keys = ["home", "home-plus", "smart-home", "hexagon", "star"];

	test("空查询返回全部（受 limit 截断），total 为总数", () => {
		expect(rankIcons(keys, "", 3)).toEqual({
			indices: [0, 1, 2],
			total: 5,
		});
		expect(rankIcons(keys, "   ", 10).indices).toHaveLength(5);
	});

	test("前缀命中排在子串命中之前", () => {
		const { indices } = rankIcons(keys, "home", 10);
		// home(0)、home-plus(1) 是前缀；smart-home(2) 只是子串
		expect(indices).toEqual([0, 1, 2]);
	});

	test("子序列仅作兜底，排在最后", () => {
		const { indices } = rankIcons(["hexagon", "home"], "hoe", 10);
		// 两者都无前缀/子串命中，均落到子序列层，保持原数组顺序
		expect(indices).toEqual([1]);
	});

	test("单字符查询不启用子序列兜底", () => {
		const { indices, total } = rankIcons(keys, "h", 10);
		// 只有前缀/子串命中：home、home-plus、smart-home、hexagon
		expect(total).toBe(4);
		expect(indices).toEqual([0, 1, 3, 2]);
	});

	test("total 不受 limit 影响", () => {
		expect(rankIcons(keys, "home", 1)).toEqual({
			indices: [0],
			total: 3,
		});
	});

	test("limit 为 0 时只统计不返回下标", () => {
		expect(rankIcons(keys, "home", 0)).toEqual({ indices: [], total: 3 });
	});

	test("无命中时返回空结果", () => {
		expect(rankIcons(keys, "zzz", 10)).toEqual({ indices: [], total: 0 });
	});

	test("查询自行归一化为小写并 trim", () => {
		expect(rankIcons(keys, "  HOME  ", 10).total).toBe(3);
	});
});
