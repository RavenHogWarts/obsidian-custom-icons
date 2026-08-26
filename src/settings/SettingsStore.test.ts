import SettingsStore from "@src/settings/SettingsStore";
import CIPlugin from "@src/main";
import { DEFAULT_SETTINGS, IPluginSettings } from "@src/types/types";

/**
 * 最小假插件：`SettingsStore` 在写入路径上只用到 `settings` 与 `saveSettings()`。
 * `saveSettings` 记下调用次数——本文件有几条断言就是关于「写了几次盘」的。
 */
const makeStore = (initial?: Partial<IPluginSettings>) => {
	const plugin = {
		settings: {
			...(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as IPluginSettings),
			...initial,
		},
		saves: 0,
		saveSettings: () => {
			plugin.saves += 1;
			return Promise.resolve();
		},
	};
	return {
		plugin,
		store: new SettingsStore(plugin as unknown as CIPlugin),
	};
};

describe("updateSettingByPath", () => {
	test("写入嵌套值", async () => {
		const { plugin, store } = makeStore();
		await store.updateSettingByPath("fileExplorer.enable", true);
		expect(plugin.settings.fileExplorer.enable).toBe(true);
		expect(plugin.saves).toBe(1);
	});

	test("整表写入（键含 . 与 / 的那些表只能这么写）", async () => {
		const { plugin, store } = makeStore();
		await store.updateSettingByPath("fileExplorer.extensions", {
			"excalidraw.md": {
				id: "excalidraw.md",
				icon: "pencil",
				type: "lucide",
				color: "",
			},
		});
		expect(
			plugin.settings.fileExplorer.extensions["excalidraw.md"].icon,
		).toBe("pencil");
	});

	test("换出新的顶层对象，React 才看得见变化", async () => {
		const { plugin, store } = makeStore();
		const before = plugin.settings;
		await store.updateSettingByPath("fileExplorer.enable", true);
		expect(plugin.settings).not.toBe(before);
	});

	test("不改动写入前的那份设置对象（路径上逐层浅拷贝）", async () => {
		const { plugin, store } = makeStore();
		const before = plugin.settings;
		const beforeFe = before.fileExplorer;
		await store.updateSettingByPath("fileExplorer.enable", true);
		expect(beforeFe.enable).toBe(false);
	});

	test("拒绝原型污染路径", async () => {
		const { store } = makeStore();
		await expect(
			store.updateSettingByPath("__proto__.polluted", true),
		).rejects.toThrow(/dangerous property/);
		await expect(
			store.updateSettingByPath("fileExplorer.constructor", true),
		).rejects.toThrow(/dangerous property/);
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
	});

	test("归一化仍然生效：只有空白的颜色收敛为空串", async () => {
		const { plugin, store } = makeStore();
		await store.updateSettingByPath("fileExplorer.fileDefault", {
			id: "",
			icon: "file",
			type: "lucide",
			color: "   ",
		});
		// normalizeIconColor 只做 trim + 空值归一，不校验颜色语法
		expect(plugin.settings.fileExplorer.fileDefault.color).toBe("");
	});

	test("归一化仍然生效：死扩展名键被丢掉", async () => {
		const { plugin, store } = makeStore();
		await store.updateSettingByPath("fileExplorer.extensions", {
			"photos/": { id: "photos/", icon: "image", type: "lucide", color: "" },
			png: { id: "png", icon: "image", type: "lucide", color: "" },
		});
		expect(
			Object.keys(plugin.settings.fileExplorer.extensions).sort(),
		).toEqual(["png"]);
	});
});

describe("deleteSettingByPath", () => {
	test("删掉存在的键并落盘一次", async () => {
		const { plugin, store } = makeStore();
		await store.updateSettingByPath("ribbon.data", {
			Search: { id: "Search", icon: "search", type: "lucide", color: "" },
		});
		const savesAfterWrite = plugin.saves;
		await store.deleteSettingByPath("ribbon.data.Search");
		expect(plugin.settings.ribbon.data.Search).toBeUndefined();
		expect(plugin.saves).toBe(savesAfterWrite + 1);
	});

	test("路径不存在时什么都不做，**也不落盘**", async () => {
		const { plugin, store } = makeStore();
		const before = plugin.settings;
		await store.deleteSettingByPath("ribbon.data.NotThere");
		expect(plugin.saves).toBe(0);
		expect(plugin.settings).toBe(before);
	});

	test("中间层就不存在时同样不落盘", async () => {
		const { plugin, store } = makeStore();
		await store.deleteSettingByPath("nope.deeper.key");
		expect(plugin.saves).toBe(0);
	});

	test("拒绝原型污染路径", async () => {
		const { store } = makeStore();
		await expect(
			store.deleteSettingByPath("ribbon.__proto__"),
		).rejects.toThrow(/dangerous property/);
	});
});

describe("store getter", () => {
	test("返回同一个对象：subscribe 引用必须稳定，否则每次渲染都重新订阅", () => {
		const { store } = makeStore();
		expect(store.store).toBe(store.store);
		expect(store.store.subscribe).toBe(store.store.subscribe);
	});

	test("getSnapshot 跟着写入变化", async () => {
		const { store } = makeStore();
		const before = store.store.getSnapshot();
		await store.updateSettingByPath("bookmarks.enable", true);
		expect(store.store.getSnapshot()).not.toBe(before);
		expect(store.store.getSnapshot().bookmarks.enable).toBe(true);
	});

	test("订阅者在写入后被通知", async () => {
		const { store } = makeStore();
		let calls = 0;
		const unsubscribe = store.store.subscribe(() => {
			calls += 1;
		});
		await store.updateSettingByPath("bookmarks.enable", true);
		expect(calls).toBe(1);
		unsubscribe();
		await store.updateSettingByPath("bookmarks.enable", false);
		expect(calls).toBe(1);
	});
});
