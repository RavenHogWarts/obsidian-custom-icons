/**
 * 图标名分层检索。
 *
 * 替代 `FuzzySuggestModal` 的「对全量条目逐键 fuzzy 打分」：
 * 分三层依次命中，越靠前越精确，且每层结果保持原数组顺序（通常已按名称排序）。
 *
 *   1. 前缀命中   `home` → `home`、`home-plus`
 *   2. 子串命中   `home` → `smart-home`
 *   3. 子序列兜底 `hme`  → `home`（仅在查询 ≥ 2 字符时启用，避免单字符命中一切）
 *
 * 调用方按「段」（收藏 / 最近 / Lucide / 我的 SVG / 各图标包）分别检索，
 * 因此单次扫描规模是一个包而不是全部图标。
 */

/** 检索结果：limit 内的下标 + 命中总数（用于分组徽标显示「N 个匹配」） */
export interface RankResult {
	/** 命中项在原数组中的下标，已按「前缀 → 子串 → 子序列」排序 */
	indices: number[];
	/** 命中总数（不受 limit 截断影响） */
	total: number;
}

/** needle 的字符是否按序出现在 haystack 中（不要求连续） */
export function isSubsequence(haystack: string, needle: string): boolean {
	if (needle.length > haystack.length) {
		return false;
	}
	let at = 0;
	for (let i = 0; i < haystack.length && at < needle.length; i++) {
		if (haystack[i] === needle[at]) {
			at++;
		}
	}
	return at === needle.length;
}

/**
 * 在已归一化为小写的候选键中检索。
 *
 * @param keys 与候选项同序的**小写**搜索键（调用方预先归一化，避免逐键 toLowerCase）
 * @param query 用户输入（内部自行 trim + 小写）
 * @param limit 返回下标数量上限；传 0 表示只统计总数不返回下标
 */
export function rankIcons(
	keys: string[],
	query: string,
	limit: number,
): RankResult {
	const needle = query.trim().toLowerCase();
	if (!needle) {
		const indices =
			limit > 0 ? keys.map((_, index) => index).slice(0, limit) : [];
		return { indices, total: keys.length };
	}

	const prefix: number[] = [];
	const substring: number[] = [];
	const fuzzy: number[] = [];
	const allowFuzzy = needle.length >= 2;

	for (let i = 0; i < keys.length; i++) {
		const at = keys[i].indexOf(needle);
		if (at === 0) {
			prefix.push(i);
		} else if (at > 0) {
			substring.push(i);
		} else if (allowFuzzy && isSubsequence(keys[i], needle)) {
			fuzzy.push(i);
		}
	}

	const total = prefix.length + substring.length + fuzzy.length;
	if (limit <= 0) {
		return { indices: [], total };
	}
	return {
		indices: prefix.concat(substring, fuzzy).slice(0, limit),
		total,
	};
}
