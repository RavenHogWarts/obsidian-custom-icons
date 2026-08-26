/**
 * 随机抽样的纯逻辑（骰子按钮的取值部分）。
 *
 * **不 import obsidian**：jest 没有 obsidian 的 moduleNameMapper，而随机逻辑
 * 原先写在 `randomIcon.ts` 里、经 `getLucideIcons` 间接引了 obsidian，于是
 * 一行都覆盖不到。与 `iconSelection.ts` / `svgGroups.ts` 同样的处理——把决策
 * 抽成纯函数，插件状态的翻译留在 `randomIcon.ts`。
 *
 * `rng` 一律可注入：默认 `Math.random`，测试传固定序列即可锁住行为。
 */

/** 随机数发生器：返回 `[0, 1)`，与 `Math.random` 同契约 */
export type Rng = () => number;

/** 把 `[0, 1)` 映射到 `[0, size)` 的下标（对越界的 rng 实现也不出界） */
function pickIndex(rng: Rng, size: number): number {
	const at = Math.floor(rng() * size);
	return at < 0 ? 0 : at >= size ? size - 1 : at;
}

/**
 * 从池子里取一个，排除 `exclude`。
 *
 * **不拷贝整池**：直接按下标取，命中排除项时往后挪（环形），最多走一圈。
 * 一个图标包可能有几万条，只为一次点击拷一遍数组不合理。
 *
 * @param keyOf 取比对键（图标侧传 `encodeIconRef`，于是排除按 `${type}:${id}`
 * 比对而不是只比名字）
 * @returns 池子为空、或池子里除了 `exclude` 没有别的可选时返回 `undefined`
 * ——调用方据此**什么都不写**，而不是写一个空图标
 */
export function sampleOne<T>(
	pool: readonly T[],
	keyOf: (item: T) => string,
	exclude?: string,
	rng: Rng = Math.random,
): T | undefined {
	if (pool.length === 0) {
		return undefined;
	}
	const start = pickIndex(rng, pool.length);
	for (let step = 0; step < pool.length; step++) {
		const item = pool[(start + step) % pool.length];
		if (exclude === undefined || keyOf(item) !== exclude) {
			return item;
		}
	}
	// 整池都是排除项（池子里只有当前图标）：没有"另一个"可掷
	return undefined;
}

/**
 * 取 `count` 个，**尽量互不相同**。
 *
 * `count` 超过可选数量时按轮循环：每轮重新洗牌再取，于是
 *   1. 绝不返回 `undefined`（原 `getUniqueRandomIcons` 会返回不足 count 项，
 *      调用方按下标取就会把 `undefined` 写进设置）；
 *   2. 重复项均匀分布，而不是前面全不同、后面全撞同一个。
 *
 * @param exclude 全部排除项的键集合（批量随机时 = 各行当前图标）。
 * 若排除后无人可选，则退回整池——「每行都换一个」是尽力而为，不是硬约束。
 * @returns 长度为 `min(count, ...)`… 实际上池子非空时**恒为 count**；池子为空时为空数组
 */
export function sampleMany<T>(
	pool: readonly T[],
	count: number,
	keyOf: (item: T) => string,
	exclude?: ReadonlySet<string>,
	rng: Rng = Math.random,
): T[] {
	if (count <= 0 || pool.length === 0) {
		return [];
	}

	let candidates =
		exclude && exclude.size > 0
			? pool.filter((item) => !exclude.has(keyOf(item)))
			: [...pool];
	if (candidates.length === 0) {
		candidates = [...pool];
	}

	const result: T[] = [];
	while (result.length < count) {
		const take = Math.min(count - result.length, candidates.length);
		// 部分 Fisher-Yates：只洗前 take 项，取 1 个时不为整池付代价
		for (let i = 0; i < take; i++) {
			const at = i + pickIndex(rng, candidates.length - i);
			[candidates[i], candidates[at]] = [candidates[at], candidates[i]];
			result.push(candidates[i]);
		}
	}
	return result;
}
