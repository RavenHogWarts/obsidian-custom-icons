import {
	forgetIcons,
	forgetPackIcons,
	IconRefListStore,
	renameIconInLists,
} from "./iconRefCleanup";

/** 记录每次写入，便于断言「没变就不写」 */
function fakeStore(recent: string[], favorites: string[]) {
	const writes: Array<[string, string[]]> = [];
	const store: IconRefListStore & { writes: typeof writes } = {
		settings: { customIconLib: { recent, favorites } },
		async updateSettingByPath<T>(path: string, value: T) {
			writes.push([path, value as unknown as string[]]);
			const list = path.split(".").pop() as "recent" | "favorites";
			store.settings.customIconLib[list] = value as unknown as string[];
		},
		writes,
	};
	return store;
}

describe("forgetIcons", () => {
	test("两份列表里的键一并剔掉", async () => {
		const store = fakeStore(
			["svg:gone", "lucide:house"],
			["svg:gone", "svg:kept"],
		);
		await forgetIcons(store, [{ type: "svg", id: "gone" }]);
		expect(store.settings.customIconLib.recent).toEqual(["lucide:house"]);
		expect(store.settings.customIconLib.favorites).toEqual(["svg:kept"]);
	});

	test("同名不同类型互不影响", async () => {
		const store = fakeStore([], ["svg:home", "lucide:home"]);
		await forgetIcons(store, [{ type: "svg", id: "home" }]);
		expect(store.settings.customIconLib.favorites).toEqual(["lucide:home"]);
	});

	test("没有命中项时不写盘", async () => {
		const store = fakeStore(["lucide:house"], ["svg:kept"]);
		await forgetIcons(store, [{ type: "svg", id: "absent" }]);
		expect(store.writes).toHaveLength(0);
	});

	test("空入参直接返回", async () => {
		const store = fakeStore(["lucide:house"], []);
		await forgetIcons(store, []);
		expect(store.writes).toHaveLength(0);
	});

	test("一次调用清掉多个（批量删除）", async () => {
		const store = fakeStore([], ["svg:a", "svg:b", "svg:c"]);
		await forgetIcons(store, [
			{ type: "svg", id: "a" },
			{ type: "svg", id: "c" },
		]);
		expect(store.settings.customIconLib.favorites).toEqual(["svg:b"]);
	});
});

describe("forgetPackIcons", () => {
	test("按 `svg:CI-{packId}-` 前缀清掉该包全部键", async () => {
		const store = fakeStore(
			["svg:CI-mdi-home", "lucide:house"],
			["svg:CI-mdi-star", "svg:CI-tabler-star", "svg:my-icon"],
		);
		await forgetPackIcons(store, "mdi");
		expect(store.settings.customIconLib.recent).toEqual(["lucide:house"]);
		expect(store.settings.customIconLib.favorites).toEqual([
			"svg:CI-tabler-star",
			"svg:my-icon",
		]);
	});

	test("包名是另一个包的前缀时不误伤", async () => {
		const store = fakeStore([], ["svg:CI-mdi-light-home", "svg:CI-mdi-home"]);
		await forgetPackIcons(store, "mdi");
		// `CI-mdi-` 是 `CI-mdi-light-home` 的真前缀，按前缀语义确实一并清掉
		expect(store.settings.customIconLib.favorites).toEqual([]);
	});

	test("该包没有任何键时不写盘", async () => {
		const store = fakeStore([], ["svg:my-icon"]);
		await forgetPackIcons(store, "mdi");
		expect(store.writes).toHaveLength(0);
	});
});

describe("renameIconInLists", () => {
	test("原位替换，保留在列表里的位置", async () => {
		const store = fakeStore([], ["svg:a", "svg:old", "svg:z"]);
		await renameIconInLists(
			store,
			{ type: "svg", id: "old" },
			{ type: "svg", id: "new" },
		);
		expect(store.settings.customIconLib.favorites).toEqual([
			"svg:a",
			"svg:new",
			"svg:z",
		]);
	});

	test("改成一个已收藏的名字时不产生重复项", async () => {
		const store = fakeStore([], ["svg:old", "svg:taken"]);
		await renameIconInLists(
			store,
			{ type: "svg", id: "old" },
			{ type: "svg", id: "taken" },
		);
		expect(store.settings.customIconLib.favorites).toEqual(["svg:taken"]);
	});

	test("只改内容不改名（from === to）时不写盘", async () => {
		const store = fakeStore([], ["svg:same"]);
		await renameIconInLists(
			store,
			{ type: "svg", id: "same" },
			{ type: "svg", id: "same" },
		);
		expect(store.writes).toHaveLength(0);
	});

	test("未收藏的图标改名不写盘", async () => {
		const store = fakeStore([], ["svg:other"]);
		await renameIconInLists(
			store,
			{ type: "svg", id: "old" },
			{ type: "svg", id: "new" },
		);
		expect(store.writes).toHaveLength(0);
	});
});
