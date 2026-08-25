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
	const packs = Object.values(deps.lib.packs)
		.filter((manifest) => manifest.enabled)
		.map((manifest) => ({
			prefix: packIconId(manifest.id, ""),
			icons: deps.getPack(manifest.id)?.icons ?? {},
		}));

	return (ref) => {
		if (ref.type === "lucide") {
			return deps.hasLucide(ref.id);
		}
		if (svgIds.has(ref.id)) {
			return true;
		}
		// 包图标的注册 id 是 `CI-{packId}-{name}`，packId 与 name 都可含连字符，
		// 没法从 id 反推切分点，所以按已启用包的前缀逐个试
		return packs.some(
			(pack) =>
				ref.id.startsWith(pack.prefix) &&
				Object.prototype.hasOwnProperty.call(
					pack.icons,
					ref.id.slice(pack.prefix.length),
				),
		);
	};
}
