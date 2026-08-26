import CIPlugin from "@src/main";
import { LL } from "@src/i18n/i18n";
import { buildPackLookup } from "./iconExists";
import { IconRef, encodeIconRef } from "./iconRef";
import { buildIconSources } from "./iconSources";
import { sampleMany, sampleOne } from "./randomSample";

/**
 * 一次随机的取值范围 = 一个**来源段 id**，与 `IconSource.id` 同一命名：
 * `"lucide"` | `"svg"` | `` `pack:${packId}` ``。
 *
 * 刻意与图标选择器的分段**一一对应**：用户在选择器里看到「我的 SVG」是一整段，
 * 骰子就该在这一整段里掷。曾按 `ICustomSVGIcon.group` 再细分到分组，但那让
 * 「看得见的范围」与「掷出的范围」不一致——选的时候不分组，随机却悄悄收窄。
 * 分组是「我的 SVG」页内的管理手段，不外溢到别的界面
 * （见 dev/260825/自定义SVG分组方案.md §4.5）。
 */
export type RandomScope = string;

/** 兜底随机域：认不出当前图标的来源时用它（Lucide 恒在，池子不会空） */
const LUCIDE_SCOPE: RandomScope = "lucide";

/** `pack:{id}` 段 id 的前缀（与 `buildIconSources` 保持同一命名） */
const PACK_PREFIX = "pack:";

/**
 * 从当前图标推断该在哪个来源段内随机。
 *
 * | 当前图标 | 随机域 |
 * | --- | --- |
 * | lucide | `lucide` |
 * | 用户导入的 SVG | `svg`（整个「我的 SVG」，不按分组细分） |
 * | 某个**已启用**包的图标 | `pack:{packId}` |
 * | 空 / 已失效（图标被删、包被停用或卸载） | `lucide` |
 *
 * 最后一行的回落正是骰子最有用的场景：一行还没配图标，掷一个先看看。
 *
 * 可以在渲染期调用（骰子的 tooltip 要它）：只查一次数组与已启用包的前缀，
 * 不枚举任何包的图标内容。
 */
export function resolveRandomScope(
	plugin: CIPlugin,
	current?: IconRef,
): RandomScope {
	// 失效的 lucide 名（手改过 data.json）也归到 lucide 段，语义正确
	if (!current?.id || current.type === "lucide") {
		return LUCIDE_SCOPE;
	}

	const lib = plugin.settings.customIconLib;
	if (lib.svg.some((icon) => icon.id === current.id)) {
		return "svg";
	}

	// 包图标：前缀判定与存在性判定共用一套（含「name 是否还在包里」那条校验）
	const packId = buildPackLookup({
		lib,
		getPack: (id) => plugin.iconPackStore.getCachedPack(id),
	})(current.id);
	return packId ? `${PACK_PREFIX}${packId}` : LUCIDE_SCOPE;
}

/**
 * 随机域的人话描述（骰子 tooltip 要说出「将在哪个范围内随机」，否则
 * 「为什么掷出来的还是这个包的图标」无从理解）。
 *
 * **不走 `buildIconSources`**：那会为一句提示把 Lucide 全部名称与整个包的 id
 * 摊成数组，而 tooltip 是每次渲染都要的（设置页可能有几十行）。三种段的标签
 * 都能从 i18n 与 manifest 直接拿到。
 */
export function describeRandomScope(
	plugin: CIPlugin,
	scope: RandomScope,
): string {
	const segment = LL.view.CustomIconLib.picker.segment;

	if (scope === "svg") {
		return LL.common.randomInSource({ source: segment.svg() });
	}
	if (scope.startsWith(PACK_PREFIX)) {
		const packId = scope.slice(PACK_PREFIX.length);
		const name = plugin.settings.customIconLib.packs[packId]?.name ?? packId;
		return LL.common.randomInSource({ source: name });
	}
	return LL.common.randomInSource({ source: segment.lucide() });
}

/**
 * 构建随机域对应的候选池。
 *
 * 只读内存缓存（`buildIconSources` 的约定），无 IO / 网络。**一次动作构建一次，
 * 不要在每次渲染里建。**
 *
 * 段不存在或恰好为空时（如当前图标指着一个刚被停用的包）回落到 Lucide——
 * 与 `resolveRandomScope` 的兜底同一个理由：骰子不该因为配置问题变成死按钮。
 */
export function buildRandomPool(
	plugin: CIPlugin,
	scope: RandomScope,
): IconRef[] {
	const sources = buildIconSources(plugin);
	const entries = sources.find((source) => source.id === scope)?.entries ?? [];
	if (entries.length > 0) {
		return entries;
	}
	return sources.find((source) => source.id === LUCIDE_SCOPE)?.entries ?? [];
}

/**
 * 掷一个图标：在 `current` 所属的来源段内随机，并排除 `current` 自己。
 *
 * @returns `undefined` = 无可掷（池子空，或池子里只剩当前图标）。调用方**什么都不写**
 * ——写一个空图标会把用户已配好的位置弄没，而弹 Notice 对一个可以连点的轻动作太吵。
 */
export function randomIconFor(
	plugin: CIPlugin,
	current?: IconRef,
): IconRef | undefined {
	const pool = buildRandomPool(plugin, resolveRandomScope(plugin, current));
	return sampleOne(
		pool,
		encodeIconRef,
		current?.id ? encodeIconRef(current) : undefined,
	);
}

/**
 * 批量掷 `count` 个，随机域取自 `anchor`（一批同来源）。
 *
 * 为什么不按各行自己的来源：那样「尽量互不相同」跨池子无意义，各池大小不同、
 * 重复策略也难向用户解释。锚点单一，tooltip 才说得清「在哪儿随机」。
 *
 * @param exclude 各行当前图标的键集合（`${type}:${id}`）——尽量不把某行掷回原样。
 * 排除后无人可选时退回整池：这是尽力而为，不是硬约束。
 */
export function randomIconsFor(
	plugin: CIPlugin,
	anchor: IconRef | undefined,
	count: number,
	exclude?: ReadonlySet<string>,
): IconRef[] {
	const pool = buildRandomPool(plugin, resolveRandomScope(plugin, anchor));
	return sampleMany(pool, count, encodeIconRef, exclude);
}
