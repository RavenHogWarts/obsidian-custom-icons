import { ICustomSVGIcon } from "@src/types/types";
import { GROUP_NAME_MAX, normalizeGroupName } from "./groupName";

/*
 * 组名的收敛规则搬到了 `util/groupName.ts`——扩展名分组要用同一份，而让文件
 * 浏览器去 import「SVG 图标库」的模块，依赖关系读起来是假的。这里继续转出，
 * 本模块既有的导入方（组件、测试）不必改。
 */
export { GROUP_NAME_MAX, normalizeGroupName };

/**
 * 「我的 SVG」页的分组筛选态。
 *
 * 三值而非二值：`null` = 全部，`""` = 仅未分组（一个筛选档，不是真实的组），
 * 其余 = 该组名。用命名类型说清，免得在组件里对着裸 `string | null` 反复解释。
 */
export type SvgGroupFilter = string | null;

/** 「仅未分组」这一档的筛选值 */
export const UNGROUPED: SvgGroupFilter = "";

/** 取图标的组名（缺失 / 脏值 / 全空白都归一为 `""` = 未分组） */
export function iconGroup(icon: ICustomSVGIcon): string {
	return normalizeGroupName(icon.group);
}

/** 一个分组及其成员数 */
export interface SvgGroupInfo {
	name: string;
	count: number;
}

/**
 * 列出所有非空分组，按名称序排列并带计数。
 *
 * 只列**真实存在成员**的组：本方案不设独立分组注册表，组名的唯一真相就是
 * 成员身上的字段，因此「空组」这一概念不存在（最后一个成员被删 / 移出即消失）。
 *
 * 排序用 `localeCompare` 与 `sortSvgIcons` 保持一致；大小写不同的两个组各占一行。
 */
export function listSvgGroups(icons: readonly ICustomSVGIcon[]): SvgGroupInfo[] {
	const counts = new Map<string, number>();
	for (const icon of icons) {
		const group = iconGroup(icon);
		if (group) {
			counts.set(group, (counts.get(group) ?? 0) + 1);
		}
	}
	return Array.from(counts, ([name, count]) => ({ name, count })).sort(
		(a, b) => a.name.localeCompare(b.name),
	);
}

/** 未分组图标的数量（决定「未分组」档是否值得显示） */
export function countUngrouped(icons: readonly ICustomSVGIcon[]): number {
	return icons.reduce((sum, icon) => (iconGroup(icon) ? sum : sum + 1), 0);
}

/**
 * 按筛选态过滤（不改动入参）。
 *
 * @param filter `null` = 全部；`""` = 仅未分组；其余 = 精确匹配该组名（区分大小写）
 */
export function filterByGroup(
	icons: readonly ICustomSVGIcon[],
	filter: SvgGroupFilter,
): ICustomSVGIcon[] {
	if (filter === null) {
		return [...icons];
	}
	const target = normalizeGroupName(filter);
	return icons.filter((icon) => iconGroup(icon) === target);
}

/**
 * 把指定 id 的图标移到某个分组（`""` = 移出分组），不改动入参。
 *
 * 选区里可能有已被删掉的 id（在另一窗口删除、或右键菜单开着时被批量删），
 * 按 id 匹配天然跳过，与现有批量删除同样的容错姿态。
 */
export function assignGroup(
	icons: readonly ICustomSVGIcon[],
	ids: ReadonlySet<string>,
	group: string,
): ICustomSVGIcon[] {
	const name = normalizeGroupName(group);
	return icons.map((icon) => {
		if (!ids.has(icon.id) || iconGroup(icon) === name) {
			return icon;
		}
		// 未分组不留空字段：与 addedAt 缺失即默认的写法一致，不往 data.json 里塞 ""
		if (!name) {
			const next = { ...icon };
			delete next.group;
			return next;
		}
		return { ...icon, group: name };
	});
}

/**
 * 重命名分组：改写全部成员的字段，不改动入参。
 *
 * `to` 已存在时自然成为**合并**（两组成员的 group 变成同一个值）——调用方负责
 * 先确认，静默合并会让用户以为图标丢了。`to` 为空则等于把整组移出分组。
 */
export function renameGroup(
	icons: readonly ICustomSVGIcon[],
	from: string,
	to: string,
): ICustomSVGIcon[] {
	const source = normalizeGroupName(from);
	if (!source) {
		return [...icons];
	}
	return assignGroup(icons, groupMemberIds(icons, source), to);
}

/**
 * 取一个分组的全部成员 id。
 *
 * 删除分组要么改这批图标的字段、要么把它们整个删掉，两条路都得先知道是谁；
 * 调用方还要拿它去清收藏 / 最近的键，所以返回 id 而不是图标本体。
 */
export function groupMemberIds(
	icons: readonly ICustomSVGIcon[],
	group: string,
): Set<string> {
	const target = normalizeGroupName(group);
	if (!target) {
		return new Set();
	}
	return new Set(
		icons.filter((icon) => iconGroup(icon) === target).map((i) => i.id),
	);
}

/**
 * 解散分组：成员留下、变成未分组，不改动入参。
 *
 * 就是 `renameGroup(icons, group, "")`，起个名字是因为这在界面上是一个独立动作，
 * 让调用处读起来是「解散」而不是「改名到空字符串」。
 */
export function dissolveGroup(
	icons: readonly ICustomSVGIcon[],
	group: string,
): ICustomSVGIcon[] {
	return renameGroup(icons, group, "");
}

/**
 * 删除分组连同其中的图标，不改动入参。
 *
 * 与「解散」是两个动作而不是一个带选项的动作：这个会真的删数据，
 * 调用方必须另外清掉收藏 / 最近里的键（`forgetIcons`），
 * 否则那些位置会留下点不动的空格——与单个 / 批量删除同一套善后。
 *
 * 空组名返回原样拷贝：`""` 在本模块里是「未分组」这一筛选档而非真实的组，
 * 让它删掉所有未分组图标太危险，只会是上游传错了值。
 */
export function deleteGroupWithIcons(
	icons: readonly ICustomSVGIcon[],
	group: string,
): ICustomSVGIcon[] {
	const drop = groupMemberIds(icons, group);
	if (drop.size === 0) {
		return [...icons];
	}
	return icons.filter((icon) => !drop.has(icon.id));
}

/**
 * 收敛落盘的筛选偏好（`ui.svgGroup`）。
 *
 * 组会随成员被删 / 移出而消失，落盘值却还指着它——不收敛就会停在一个永远
 * 空空如也的筛选上（而 tab 行里根本没有对应项，用户也无从点回「全部」）。
 *
 * **落盘编码只有两种：`""` = 全部，其余 = 组名。**「仅未分组」这一档不落盘，
 * 重开视图回到「全部」。原因是 `SettingsStore#mergeWithDefaults` 按 `typeof`
 * 比对默认值与存档值，默认值写成 `null` 会让任何已存的字符串被丢弃（`"object"`
 * 与 `"string"` 不匹配即回退默认）——于是 `null` 不能作为落盘默认值，三个筛选态
 * 只能压进一个字符串。要区分就得造一个不会与组名相撞的哨兵值，而组名允许任意
 * 字符，哨兵总有相撞的余地；为一个筛选档付这个代价不值。
 *
 * @param available 当前存在的组名（`listSvgGroups` 的结果）
 */
export function normalizeSvgGroup(
	raw: unknown,
	available: readonly string[],
): SvgGroupFilter {
	// 未落盘 / 脏值（含 null）/ 空串 → 全部
	if (typeof raw !== "string") {
		return null;
	}
	const name = normalizeGroupName(raw);
	if (!name) {
		return null;
	}
	return available.includes(name) ? name : null;
}

/**
 * 把筛选态编码为落盘值。
 * 「仅未分组」与「全部」都落成 `""`——见 `normalizeSvgGroup` 的说明。
 */
export function encodeSvgGroupPref(filter: SvgGroupFilter): string {
	return filter === null ? "" : normalizeGroupName(filter);
}
