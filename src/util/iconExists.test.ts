import {
	buildIconExistence,
	buildPackLookup,
	IconExistenceDeps,
} from "./iconExists";

const PACKS: Record<string, { icons: Record<string, string> }> = {
	mdi: { icons: { home: "<svg/>", star: "<svg/>" } },
	off: { icons: { ghost: "<svg/>" } },
};

/** mdi 包已启用且含 home/star；用户 SVG 有 my-icon；lucide 只认 house */
function deps(overrides: Partial<IconExistenceDeps> = {}): IconExistenceDeps {
	return {
		lib: {
			svg: [
				{ id: "my-icon", content: "<svg/>" },
				{ id: "blank", content: "" },
			],
			packs: {
				mdi: { id: "mdi", enabled: true },
				off: { id: "off", enabled: false },
			},
		},
		getPack: (packId) => PACKS[packId] ?? null,
		hasLucide: (name) => name === "house",
		...overrides,
	};
}

describe("buildIconExistence", () => {
	test("lucide 走 hasLucide", () => {
		const exists = buildIconExistence(deps());
		expect(exists({ type: "lucide", id: "house" })).toBe(true);
		expect(exists({ type: "lucide", id: "gone" })).toBe(false);
	});

	test("用户导入的 SVG 按 id 认", () => {
		const exists = buildIconExistence(deps());
		expect(exists({ type: "svg", id: "my-icon" })).toBe(true);
		expect(exists({ type: "svg", id: "deleted" })).toBe(false);
	});

	test("内容为空的条目算不存在（与注册条件一致）", () => {
		const exists = buildIconExistence(deps());
		expect(exists({ type: "svg", id: "blank" })).toBe(false);
	});

	test("内容为空的用户 SVG 算不存在（不会进注册表）", () => {
		const exists = buildIconExistence(deps());
		expect(exists({ type: "svg", id: "blank" })).toBe(false);
	});

	test("已启用包里的图标算存在", () => {
		const exists = buildIconExistence(deps());
		expect(exists({ type: "svg", id: "CI-mdi-home" })).toBe(true);
	});

	test("包更新后被删掉的图标不再存在（前缀对但名字没了）", () => {
		const exists = buildIconExistence(deps());
		expect(exists({ type: "svg", id: "CI-mdi-removed" })).toBe(false);
	});

	test("停用包里的图标算不存在（渲染不出来）", () => {
		const exists = buildIconExistence(deps());
		expect(exists({ type: "svg", id: "CI-off-ghost" })).toBe(false);
	});

	test("包未加载（文件缺失/损坏）时其图标算不存在", () => {
		const exists = buildIconExistence(deps({ getPack: () => null }));
		expect(exists({ type: "svg", id: "CI-mdi-home" })).toBe(false);
	});

	test("manifest 里已没有的包，其残留键算不存在", () => {
		const exists = buildIconExistence(deps());
		expect(exists({ type: "svg", id: "CI-gone-home" })).toBe(false);
	});

	test("名字含连字符与冒号照常判定（无法从 id 反推切分点）", () => {
		const exists = buildIconExistence(
			deps({
				getPack: () => ({
					icons: { "mdi:arrow-left": "<svg/>" },
				}),
			}),
		);
		expect(exists({ type: "svg", id: "CI-mdi-mdi:arrow-left" })).toBe(true);
	});
});

/**
 * `buildPackLookup` 单独测：`buildIconExistence` 只透出布尔值，锁不住「返回的是
 * 哪个包」——而随机域推断要靠这个 id 去取对应的段（掷出的图标必须来自同一个包）。
 */
describe("buildPackLookup", () => {
	test("命中已启用包时返回该包 id", () => {
		const packOf = buildPackLookup(deps());
		expect(packOf("CI-mdi-home")).toBe("mdi");
	});

	test("用户自己导入的 SVG 不属于任何包", () => {
		const packOf = buildPackLookup(deps());
		expect(packOf("my-icon")).toBeNull();
	});

	test("停用的包不认（掷进去的图标渲染不出来）", () => {
		const packOf = buildPackLookup(deps());
		expect(packOf("CI-off-ghost")).toBeNull();
	});

	test("前缀对但 name 已随包更新消失：不算命中", () => {
		const packOf = buildPackLookup(deps());
		expect(packOf("CI-mdi-removed")).toBeNull();
	});

	test("packId 本身含连字符时按前缀逐个试仍能认出", () => {
		const packOf = buildPackLookup({
			lib: {
				svg: [],
				packs: {
					"fa-solid": { id: "fa-solid", enabled: true },
				},
			},
			getPack: () => ({ icons: { "arrow-left": "<svg/>" } }),
		});
		expect(packOf("CI-fa-solid-arrow-left")).toBe("fa-solid");
	});
});
