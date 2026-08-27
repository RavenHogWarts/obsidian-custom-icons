import { describeIconId, type DescribeIconDeps } from "./describeIcon";

/**
 * 造一份假索引。
 *
 * `packOf` 按「已启用包的前缀 + name 确实在包里」判定，与 `buildPackLookup` 的
 * 真实语义一致（包更新后消失的 name 前缀仍对，但已经渲染不出来了）。
 */
function deps(overrides?: {
	svgIds?: string[];
	packs?: Record<string, { name: string; icons: string[] }>;
	registry?: string[];
	lucide?: string[];
}): DescribeIconDeps {
	const packs = overrides?.packs ?? {};
	const registry = new Set(overrides?.registry ?? []);
	const lucide = new Set(overrides?.lucide ?? []);
	const packNames: Record<string, string> = {};
	for (const [id, pack] of Object.entries(packs)) {
		packNames[id] = pack.name;
	}

	return {
		svgIds: new Set(overrides?.svgIds ?? []),
		packNames,
		packOf: (id) => {
			for (const [packId, pack] of Object.entries(packs)) {
				const prefix = `CI-${packId}-`;
				if (
					id.startsWith(prefix) &&
					pack.icons.includes(id.slice(prefix.length))
				) {
					return packId;
				}
			}
			return null;
		},
		inRegistry: (id) => registry.has(id),
		hasLucide: (name) => lucide.has(name),
	};
}

describe("describeIconId", () => {
	test("空 id 返回 null", () => {
		expect(describeIconId("", deps())).toBeNull();
	});

	describe("用户导入的 SVG", () => {
		test("裸 id 补前缀后能反查回来", () => {
			const info = describeIconId(
				"CI-我的图标",
				deps({ svgIds: ["我的图标"] }),
			);
			expect(info).toEqual({
				id: "CI-我的图标",
				source: "user-svg",
				name: "我的图标",
				renderable: "registry",
			});
		});

		test("id 本身以 CI- 开头时不叠第二层前缀", () => {
			// handler 对这种 id 直接原样注册，反查必须先试字面匹配
			const info = describeIconId("CI-foo", deps({ svgIds: ["CI-foo"] }));
			expect(info).toMatchObject({ source: "user-svg", name: "CI-foo" });
		});

		test("content 为空的条目视为不存在（与注册条件对齐）", () => {
			// 调用方只把 content 非空的 id 放进 svgIds，这里验证兜底不为它编造来源
			expect(describeIconId("CI-空图标", deps())).toBeNull();
		});
	});

	describe("图标包", () => {
		const withMdi = deps({
			packs: { mdi: { name: "Material Design Icons", icons: ["home"] } },
		});

		test("给出 packId / 包内原名 / 显示名", () => {
			expect(describeIconId("CI-mdi-home", withMdi)).toEqual({
				id: "CI-mdi-home",
				source: "pack",
				name: "home",
				packId: "mdi",
				packName: "Material Design Icons",
				renderable: "registry",
			});
		});

		test("包 id 与图标名都含连字符时切分点正确", () => {
			const info = describeIconId(
				"CI-vscode-icons-default-file",
				deps({
					packs: {
						"vscode-icons": {
							name: "VSCode Icons",
							icons: ["default-file"],
						},
					},
				}),
			);
			expect(info).toMatchObject({
				source: "pack",
				packId: "vscode-icons",
				name: "default-file",
			});
		});

		test("前缀对但 name 已不在包里 → null（包更新后消失的图标）", () => {
			// 这一条正是方案 §1.1 要消灭的空白路径：光看前缀会误判成存在
			expect(describeIconId("CI-mdi-gone", withMdi)).toBeNull();
		});

		test("包被停用 / 卸载后 → null", () => {
			expect(describeIconId("CI-mdi-home", deps())).toBeNull();
		});
	});

	test("用户 SVG 与包图标撞同一注册 id 时判给 SVG", () => {
		// 用户 SVG 叫 `mdi-home` 时注册成 CI-mdi-home，与 mdi 包里的 home 一模一样
		const info = describeIconId(
			"CI-mdi-home",
			deps({
				svgIds: ["mdi-home"],
				packs: { mdi: { name: "MDI", icons: ["home"] } },
			}),
		);
		expect(info).toMatchObject({ source: "user-svg", name: "mdi-home" });
	});

	describe("Lucide", () => {
		test("注册表里有 → builtin / registry 档", () => {
			const info = describeIconId(
				"lucide-sun",
				deps({ registry: ["lucide-sun"], lucide: ["sun"] }),
			);
			expect(info).toEqual({
				id: "lucide-sun",
				source: "builtin",
				name: "sun",
				renderable: "registry",
			});
		});

		test("注册表里没有但 bundle 里有 → 差集，只能经 api 渲染", () => {
			const info = describeIconId(
				"lucide-某个新图标",
				deps({ lucide: ["某个新图标"] }),
			);
			expect(info).toEqual({
				id: "lucide-某个新图标",
				source: "lucide-extra",
				name: "某个新图标",
				renderable: "api",
			});
		});

		test("两边都没有 → null", () => {
			expect(describeIconId("lucide-不存在", deps())).toBeNull();
		});
	});

	describe("其他 id", () => {
		test("注册表里有的非前缀 id 照画（Obsidian 自带 / 别的插件注册的）", () => {
			const info = describeIconId("folder", deps({ registry: ["folder"] }));
			expect(info).toMatchObject({
				source: "builtin",
				name: "folder",
				renderable: "registry",
			});
		});

		test("CI- 开头但不属于本插件、注册表里也没有 → null", () => {
			expect(describeIconId("CI-别的插件的", deps())).toBeNull();
		});

		test("CI- 开头、非本插件来源但注册表里有 → 当作 builtin 照画", () => {
			const info = describeIconId(
				"CI-别的插件的",
				deps({ registry: ["CI-别的插件的"] }),
			);
			expect(info).toMatchObject({ source: "builtin" });
		});
	});
});
