import { IconType } from "@src/types/types";

/** 一个图标的完整引用：类型 + 注册 id */
export interface IconRef {
	type: IconType;
	id: string;
}

/**
 * 编码为 `${type}:${id}` 复合键（用于 recent / favorites 的存储）。
 *
 * `lucide` 与 `svg` 是两个命名空间、可能撞名，因此不能只存裸 id。
 */
export function encodeIconRef(ref: IconRef): string {
	return `${ref.type}:${ref.id}`;
}

/**
 * 解码复合键。
 *
 * 只在**首个**冒号处切分：图标 id 本身可能含冒号（Iconify 名称形如 `mdi:home`
 * 时经 packIconId 会变成 `CI-mdi-mdi:home`），而类型名不含冒号。
 *
 * @returns 解析结果；键不合法（无冒号、类型未知、id 为空）时返回 null
 */
export function decodeIconRef(key: string): IconRef | null {
	const at = key.indexOf(":");
	if (at <= 0 || at === key.length - 1) {
		return null;
	}
	const type = key.slice(0, at);
	if (type !== "lucide" && type !== "svg") {
		return null;
	}
	return { type, id: key.slice(at + 1) };
}

/**
 * 把复合键列表解码为图标引用，丢弃不合法项。
 * 用于读取 recent / favorites（历史数据或手改 data.json 都可能带脏值）。
 */
export function decodeIconRefs(keys: string[]): IconRef[] {
	const refs: IconRef[] = [];
	for (const key of keys) {
		const ref = decodeIconRef(key);
		if (ref) {
			refs.push(ref);
		}
	}
	return refs;
}

/**
 * 把 key 前插到列表首位并去重，超出上限时截断。
 * 用于「最近使用」：最新选中的排最前，重复选择不产生重复项。
 */
export function pushRecent(
	recent: string[],
	key: string,
	limit: number,
): string[] {
	return [key, ...recent.filter((item) => item !== key)].slice(0, limit);
}

/** 收藏开关：已在列表中则移除，否则追加到末尾（保持用户添加顺序） */
export function toggleFavorite(favorites: string[], key: string): string[] {
	return favorites.includes(key)
		? favorites.filter((item) => item !== key)
		: [...favorites, key];
}

/**
 * 从复合键列表中移除指定键。
 *
 * 用于图标删除后清理 recent / favorites——这两份列表只存键，不会随图标本体
 * 消失而自动收缩（渲染期另有 `buildIconExistence` 兜底，这里是不让死键积累）。
 */
export function removeIconKeys(
	keys: string[],
	drop: ReadonlySet<string>,
): string[] {
	return keys.filter((key) => !drop.has(key));
}

/**
 * 移除所有以 prefix 开头的键。
 * 用于卸载图标包：其全部图标的键形如 `svg:CI-{packId}-{name}`，按前缀扫比逐个枚举划算。
 */
export function removeIconKeysByPrefix(
	keys: string[],
	prefix: string,
): string[] {
	return keys.filter((key) => !key.startsWith(prefix));
}

/**
 * 把 from 键原位换成 to 键（图标改名时跟着迁移，保留它在列表里的位置）。
 *
 * to 已经在列表里时只移除 from——否则改成一个已收藏的名字会留下两条重复项。
 */
export function renameIconKey(
	keys: string[],
	from: string,
	to: string,
): string[] {
	if (from === to || !keys.includes(from)) {
		return keys;
	}
	if (keys.includes(to)) {
		return keys.filter((key) => key !== from);
	}
	return keys.map((key) => (key === from ? to : key));
}
