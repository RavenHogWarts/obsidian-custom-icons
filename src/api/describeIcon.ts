import { CustomIconsIconInfo } from "./types";

/** 本插件注册进 Obsidian 的图标一律带这个前缀 */
export const CI_PREFIX = "CI-";

/** Obsidian 内置 Lucide 的注册前缀 */
export const LUCIDE_PREFIX = "lucide-";

/**
 * `describeIconId` 真正读到的那几件事。
 *
 * 只声明这么多（而不是收下整个 `CIPlugin`）是为了让这段逻辑能在 jest 的 node
 * 环境里单测——它是 §3.1 那条「注册 id 不可逆向切分」规则的唯一实现，
 * 抄错的代价是消费方把错的 id 写进用户笔记。
 * 与 `util/iconExists.ts` 的 `IconExistenceDeps`、`util/iconRefCleanup.ts` 的
 * `IconRefListStore` 是同一个套路。
 */
export interface DescribeIconDeps {
	/** 用户导入的单个 SVG 的**裸 id** 集合（只含 content 非空的，与注册条件对齐） */
	svgIds: ReadonlySet<string>;
	/** 注册 id → packId；不属于任何**已启用**包时返回 null（见 `buildPackLookup`） */
	packOf(id: string): string | null;
	/** packId → 显示名 */
	packNames: Readonly<Record<string, string>>;
	/** 该 id 在 Obsidian 全局注册表里吗 */
	inRegistry(id: string): boolean;
	/** 该 lucide 名在本插件 bundle 的 lucide-react 里吗（含 Obsidian 未内置的差集） */
	hasLucide(name: string): boolean;
}

/**
 * 注册 id → 元信息。**这是「不要让消费方猜切分点」那句承诺的落地处。**
 *
 * 判定顺序与理由见 dev/ecosystem/跨插件API导出方案.md §3.1 / §3.2：
 * `CI-{packId}-{name}` 不可逆向切分（packId 与 name 都可含 `-`），
 * 所以只能按「用户 SVG 的 id 集合」与「已启用包的前缀」两份只有本插件有的
 * 知识去试，而不是找某个连字符切一刀。
 *
 * @returns 画不出来时返回 `null`（对应契约里的 `renderable: "none"`）
 */
export function describeIconId(
	id: string,
	deps: DescribeIconDeps,
): CustomIconsIconInfo | null {
	if (!id) {
		return null;
	}

	if (id.startsWith(CI_PREFIX)) {
		/*
		 * 用户 SVG 先于图标包判定。
		 *
		 * 两者可以撞同一个注册 id：用户 SVG 叫 `mdi-home` 时注册成 `CI-mdi-home`，
		 * 与 mdi 包里的 `home` 一模一样，此时注册表只留最后写进去的那个。
		 * `CustomIconLibHandler.apply()` 里 SVG 与包的注册各有节流条件，但稳态下
		 * （签名不变、包对象不变）两者都不重注册，谁赢取决于最后一次真正写入——
		 * 而用户改 SVG 的频率远高于装包，故按 SVG 优先判定。
		 */
		// 先试字面匹配：用户 SVG 的 id 本身就以 CI- 开头时，handler 不会再叠一层前缀
		if (deps.svgIds.has(id)) {
			return { id, source: "user-svg", name: id, renderable: "registry" };
		}
		const bare = id.slice(CI_PREFIX.length);
		if (deps.svgIds.has(bare)) {
			return { id, source: "user-svg", name: bare, renderable: "registry" };
		}

		const packId = deps.packOf(id);
		if (packId) {
			return {
				id,
				source: "pack",
				name: id.slice(`${CI_PREFIX}${packId}-`.length),
				packId,
				packName: deps.packNames[packId],
				renderable: "registry",
			};
		}

		// CI- 开头却不属于本插件的任何来源：可能是别的插件注册的，
		// 也可能是已失效的残留（图标被删 / 包被停用）——后者必须判成 null，
		// 那正是方案 §1.1 要消灭的「resolve 成功却画不出东西」
		return deps.inRegistry(id)
			? { id, source: "builtin", name: id, renderable: "registry" }
			: null;
	}

	if (id.startsWith(LUCIDE_PREFIX)) {
		const name = id.slice(LUCIDE_PREFIX.length);
		if (deps.inRegistry(id)) {
			return { id, source: "builtin", name, renderable: "registry" };
		}
		// 差集：注册表里没有，但本插件 bundle 的 lucide-react 里有，
		// 只有 api.renderTo 画得出来（见 §3.2）
		if (deps.hasLucide(name)) {
			return { id, source: "lucide-extra", name, renderable: "api" };
		}
		return null;
	}

	// 其余一切：只要注册表里有就照画（Obsidian 自带的非 lucide 图标、
	// 别的插件注册的图标都落在这里）
	return deps.inRegistry(id)
		? { id, source: "builtin", name: id, renderable: "registry" }
		: null;
}
