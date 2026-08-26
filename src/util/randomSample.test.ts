import { Rng, sampleMany, sampleOne } from "./randomSample";

/** 固定序列的 rng：用尽后回绕，便于写"连续取多次"的用例 */
const seq = (...values: number[]): Rng => {
	let at = 0;
	return () => values[at++ % values.length];
};

const id = (value: string) => value;
const pool = ["a", "b", "c", "d"];

describe("sampleOne", () => {
	test("按 rng 落点取值", () => {
		// 0.5 * 4 = 2 → "c"
		expect(sampleOne(pool, id, undefined, seq(0.5))).toBe("c");
	});

	test("空池返回 undefined", () => {
		expect(sampleOne([], id, undefined, seq(0.5))).toBeUndefined();
	});

	test("命中排除项时挪到下一个", () => {
		// 落点 "c" 被排除 → 顺延到 "d"
		expect(sampleOne(pool, id, "c", seq(0.5))).toBe("d");
	});

	test("排除项在末位时环回开头", () => {
		// 0.99 * 4 = 3 → "d" 被排除 → 环回 "a"
		expect(sampleOne(pool, id, "d", seq(0.99))).toBe("a");
	});

	test("池子里只有当前图标时返回 undefined（没有另一个可掷）", () => {
		expect(sampleOne(["a"], id, "a", seq(0))).toBeUndefined();
	});

	test("rng 返回边界值不出界", () => {
		expect(sampleOne(pool, id, undefined, seq(1))).toBe("d");
		expect(sampleOne(pool, id, undefined, seq(0))).toBe("a");
	});

	test("不改动入参", () => {
		const source = [...pool];
		sampleOne(source, id, undefined, seq(0.5));
		expect(source).toEqual(pool);
	});
});

describe("sampleMany", () => {
	test("count 小于池子时互不相同", () => {
		const picked = sampleMany(pool, 3, id, undefined, seq(0.1, 0.9, 0.4));
		expect(picked).toHaveLength(3);
		expect(new Set(picked).size).toBe(3);
	});

	test("count 超过池子时循环复用，绝不返回 undefined", () => {
		const picked = sampleMany(["a", "b"], 5, id, undefined, seq(0.1, 0.7));
		expect(picked).toHaveLength(5);
		expect(picked.every((item) => item !== undefined)).toBe(true);
		// 每一项都来自池子
		expect(picked.every((item) => item === "a" || item === "b")).toBe(true);
	});

	test("排除集生效", () => {
		const picked = sampleMany(
			pool,
			2,
			id,
			new Set(["a", "b"]),
			seq(0.1, 0.9),
		);
		expect(picked.sort()).toEqual(["c", "d"]);
	});

	test("排除后无人可选时退回整池（尽力而为，不是硬约束）", () => {
		const picked = sampleMany(pool, 2, id, new Set(pool), seq(0.1, 0.9));
		expect(picked).toHaveLength(2);
		expect(picked.every((item) => pool.includes(item))).toBe(true);
	});

	test("count <= 0 或空池返回空数组", () => {
		expect(sampleMany(pool, 0, id, undefined, seq(0.5))).toEqual([]);
		expect(sampleMany([], 3, id, undefined, seq(0.5))).toEqual([]);
	});

	test("不改动入参", () => {
		const source = [...pool];
		sampleMany(source, 4, id, undefined, seq(0.1, 0.5, 0.9, 0.3));
		expect(source).toEqual(pool);
	});

	test("同一 rng 序列下结果确定", () => {
		const rngA = seq(0.1, 0.5, 0.9);
		const rngB = seq(0.1, 0.5, 0.9);
		expect(sampleMany(pool, 3, id, undefined, rngA)).toEqual(
			sampleMany(pool, 3, id, undefined, rngB),
		);
	});
});
