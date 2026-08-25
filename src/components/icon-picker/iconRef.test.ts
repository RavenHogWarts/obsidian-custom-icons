import {
	decodeIconRef,
	decodeIconRefs,
	encodeIconRef,
	pushRecent,
	toggleFavorite,
} from "./iconRef";

describe("encodeIconRef / decodeIconRef", () => {
	test("往返一致", () => {
		const ref = { type: "lucide" as const, id: "home" };
		expect(decodeIconRef(encodeIconRef(ref))).toEqual(ref);
	});

	test("只在首个冒号处切分（id 自身可含冒号）", () => {
		expect(decodeIconRef("svg:CI-mdi-mdi:home")).toEqual({
			type: "svg",
			id: "CI-mdi-mdi:home",
		});
	});

	test("拒绝不合法键", () => {
		expect(decodeIconRef("home")).toBeNull();
		expect(decodeIconRef(":home")).toBeNull();
		expect(decodeIconRef("lucide:")).toBeNull();
		expect(decodeIconRef("unknown:home")).toBeNull();
		expect(decodeIconRef("")).toBeNull();
	});
});

describe("decodeIconRefs", () => {
	test("丢弃脏值，保留顺序", () => {
		expect(
			decodeIconRefs(["lucide:home", "garbage", "svg:my-icon"]),
		).toEqual([
			{ type: "lucide", id: "home" },
			{ type: "svg", id: "my-icon" },
		]);
	});
});

describe("pushRecent", () => {
	test("前插到首位", () => {
		expect(pushRecent(["b", "c"], "a", 10)).toEqual(["a", "b", "c"]);
	});

	test("重复选择不产生重复项，且提到首位", () => {
		expect(pushRecent(["b", "a", "c"], "a", 10)).toEqual(["a", "b", "c"]);
	});

	test("超出上限时截断尾部", () => {
		expect(pushRecent(["b", "c", "d"], "a", 3)).toEqual(["a", "b", "c"]);
	});

	test("不改动入参", () => {
		const original = ["b", "c"];
		pushRecent(original, "a", 10);
		expect(original).toEqual(["b", "c"]);
	});
});

describe("toggleFavorite", () => {
	test("未收藏则追加到末尾（保持添加顺序）", () => {
		expect(toggleFavorite(["a"], "b")).toEqual(["a", "b"]);
	});

	test("已收藏则移除", () => {
		expect(toggleFavorite(["a", "b", "c"], "b")).toEqual(["a", "c"]);
	});

	test("不改动入参", () => {
		const original = ["a"];
		toggleFavorite(original, "b");
		expect(original).toEqual(["a"]);
	});
});
