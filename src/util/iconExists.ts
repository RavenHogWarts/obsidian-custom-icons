import { packIconId } from "@src/service/icon-packs/types";
import { IconRef } from "./iconRef";

/**
 * 判定图标是否还存在所需的最小依赖。
 *
 * 只声明真正读到的字段（而不是整个 `ICustomIconLib`），于是单测可以直接给字面量，
 * 也不必反向依赖 service 层的 manifest 形状。
 */
export interface IconExistenceDeps {
	lib: {
		svg: readonly { id: string; content: string }[];
		packs: Readonly<Record<string, { id: string; enabled: boolean }>>;
	};
	/** 取包内容；未加载或文件损坏时返回 null */
	getPack(packId: string): { icons: Record<string, string> } | null;
	/** 该 lucide 名是否可渲染 */
	hasLucide(name: string): boolean;
}

/**
 * 构建「这个 svg 注册 id 属于哪个已启用图标包」的判定函数。
 *
 * 包图标的注册 id 是 `CI-{packId}-{name}`，而 packId 与 name **都可含连字符**
 * （name 甚至可含冒号，如 Iconify 的 `mdi:home`），没法从 id 反推切分点，
 * 所以只能按已启用包的前缀逐个试，并要求 name 确实在该包的图标表里
 * ——包更新后消失的 name 前缀仍对，但已经渲染不出来了。
 *
 * 抽成独立函数是因为这套知识有两个消费方：存在性判定（`buildIconExistence`）
 * 与随机域推断（`randomIcon.ts` 要知道「当前图标属于哪个包」才能在同一个包里
 * 随机）。抄第二遍必然会漏掉上面那条 name 校验。
 *
 * @returns 命中则返回 packId，否则 `null`（用户自己导入的 SVG 也走这条路返回 null）
 */
export function buildPackLookup(
	deps: Pick<IconExistenceDeps, "lib" | "getPack">,
): (id: string) => string | null {
	const packs = Object.values(deps.lib.packs)
		.filter((manifest) => manifest.enabled)
		.map((manifest) => ({
			id: manifest.id,
			prefix: packIconId(manifest.id, ""),
			icons: deps.getPack(manifest.id)?.icons ?? {},
		}));

	return (id) => {
		for (const pack of packs) {
			if (
				id.startsWith(pack.prefix) &&
				Object.prototype.hasOwnProperty.call(
					pack.icons,
					id.slice(pack.prefix.length),
				)
			) {
				return pack.id;
			}
		}
		return null;
	};
}

/**
 * 构建「这个图标引用现在还能渲染吗」的判定函数。
 *
 * `recent` / `favorites` 只存 `${type}:${id}` 键，图标被删掉、改名，或所属包被
 * 卸载 / 停用 / 更新后，键会留在设置里指向一个已注销的 id——铺出来就是一格空白。
 * 因此凡要渲染这两份列表，先过一遍这个判定。
 *
 * 判定依据是设置 + 包缓存（即注册表的来源），而不是 `getIconIds()`：后者每次都要
 * 把上万条 id 摊成集合，还得假设 applyAll 已经跑过。
 *
 * 返回的函数逐个引用判断，不构造全量集合——收藏以十计，已启用包以个计，
 * 逐个试前缀的代价可忽略。
 */
export function buildIconExistence(
	deps: IconExistenceDeps,
): (ref: IconRef) => boolean {
	// 与 CustomIconLibHandler 的注册条件对齐：内容为空的条目不会进注册表，
	// 因此对收藏而言等同于不存在
	const svgIds = new Set(
		deps.lib.svg.filter((icon) => icon.content).map((icon) => icon.id),
	);
	const packOf = buildPackLookup(deps);

	return (ref) => {
		if (ref.type === "lucide") {
			return deps.hasLucide(ref.id);
		}
		if (svgIds.has(ref.id)) {
			return true;
		}
		return packOf(ref.id) !== null;
	};
}
