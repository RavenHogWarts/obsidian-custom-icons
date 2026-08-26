import { IFileExplorerIconOverride, IconType } from "@src/types/types";
import { normalizeGroupName } from "./groupName";

/**
 * 扩展名分组的纯逻辑：全部「入 map 出 map」，不碰设置存储、不碰 React。
 *
 * 建模与[自定义 SVG 分组](../../dev/260825/自定义SVG分组方案.md#24-采用的数据形状)同构：
 * **组名挂在成员身上**（`extensions[ext].group`），没有独立分组注册表。因此
 *
 * - 解析层零改动——`resolveFileIcon` 仍是 `extensions[compoundExt] ?? extensions[ext]`
 *   两级 O(1) 查表，不需要反向索引，也不存在「单条 vs 分组」的优先级冲突；
 * - 空组不存在（最后一个成员被移出 / 删除即消失）；
 * - 一个扩展名结构上无法属于两个组（它只有一个 `group` 字段）；
 * - 组名是**值**不是键，没有 `__proto__` 之类的原型污染面。
 *
 * 代价是**组的图标不是单一真相**：图标在每个成员上各存一份，用户单独改过某个成员
 * 之后组就进入「混合」态。这不是 bug 而是这套建模的固有性质，`uniformIcon` 存在
 * 就是为了让界面能算出并如实显示它——藏起来假装一致会让「我明明改过 .svg」凭空消失。
 */

/** extensions 表的形状（键 = 归一化后的扩展名） */
export type ExtensionMap = Record<string, IFileExplorerIconOverride>;

/** 取一条规则的组名（缺失 / 脏值 / 全空白都归一为 `""` = 未分组） */
export function ruleGroup(rule: IFileExplorerIconOverride): string {
	return normalizeGroupName(rule.group);
}

/** 一个分组及其成员数 */
export interface ExtensionGroupInfo {
	name: string;
	/** 组内扩展名条数 */
	count: number;
}

/**
 * 列出所有非空分组，按名称序排列并带计数。
 *
 * 与 `listSvgGroups` 同一姿态：只列**真实存在成员**的组，排序用 `localeCompare`，
 * 大小写不同的两个组各占一行。
 */
export function listGroups(map: ExtensionMap): ExtensionGroupInfo[] {
	const counts = new Map<string, number>();
	for (const rule of Object.values(map)) {
		const group = ruleGroup(rule);
		if (group) {
			counts.set(group, (counts.get(group) ?? 0) + 1);
		}
	}
	return Array.from(counts, ([name, count]) => ({ name, count })).sort(
		(a, b) => a.name.localeCompare(b.name),
	);
}

/**
 * 取一个分组的全部成员扩展名。
 *
 * 空组名返回空集：`""` 在本模块里是「未分组」这一档而非真实的组，让它匹配上
 * 所有未分组规则会把「解散 / 删除」这类动作误伤到一大片。
 */
export function groupMembers(map: ExtensionMap, group: string): string[] {
	const target = normalizeGroupName(group);
	if (!target) {
		return [];
	}
	return Object.keys(map).filter((ext) => ruleGroup(map[ext]) === target);
}

/** 未分组的扩展名（组行之外那一段，调用方还要自己排序） */
export function ungroupedKeys(map: ExtensionMap): string[] {
	return Object.keys(map).filter((ext) => !ruleGroup(map[ext]));
}

/**
 * 把若干扩展名移到某个分组（`""` = 移出分组），不改动入参。
 *
 * 传入的扩展名可能已不在 map 里（另一窗口删了、菜单开着时被批量清空），
 * 按键匹配天然跳过——与既有批量操作同样的容错姿态。
 */
export function assignGroup(
	map: ExtensionMap,
	exts: readonly string[],
	group: string,
): ExtensionMap {
	const name = normalizeGroupName(group);
	const targets = new Set(exts);
	const next: ExtensionMap = {};
	for (const [ext, rule] of Object.entries(map)) {
		if (!targets.has(ext) || ruleGroup(rule) === name) {
			next[ext] = rule;
			continue;
		}
		if (!name) {
			// 未分组不留空字段：与 addedAt 缺失即默认的写法一致，不往 data.json 塞 ""
			const copy = { ...rule };
			delete copy.group;
			next[ext] = copy;
			continue;
		}
		next[ext] = { ...rule, group: name };
	}
	return next;
}

/**
 * 重命名分组：改写全部成员的字段，不改动入参。
 *
 * `to` 已存在时自然成为**合并**——调用方负责先确认，静默合并会让用户以为配置丢了。
 * `to` 为空则等于解散（见 `dissolveGroup`，那是界面上的独立动作）。
 */
export function renameGroup(
	map: ExtensionMap,
	from: string,
	to: string,
): ExtensionMap {
	const source = normalizeGroupName(from);
	if (!source) {
		return { ...map };
	}
	return assignGroup(map, groupMembers(map, source), to);
}

/**
 * 解散分组：规则留下、变成未分组，不改动入参。
 *
 * 就是 `renameGroup(map, group, "")`，起个名字是因为这在界面上是一个独立动作，
 * 让调用处读起来是「解散」而不是「改名到空字符串」。
 */
export function dissolveGroup(map: ExtensionMap, group: string): ExtensionMap {
	return renameGroup(map, group, "");
}

/**
 * 删除分组连同其中的规则，不改动入参。
 *
 * 与「解散」是两个动作而不是一个带选项的动作：没有独立注册表，「删掉这个组」在
 * 数据层是两件完全不同的事（只清 `group` 字段 vs 把条目本身删掉）。前者无损、
 * 后者让这些扩展名回落到 `fileDefault`。做成一个动作 + 一个复选框，等于把
 * 「会不会丢配置」压在一个默认值上。
 */
export function deleteGroupWithRules(
	map: ExtensionMap,
	group: string,
): ExtensionMap {
	const drop = new Set(groupMembers(map, group));
	if (drop.size === 0) {
		return { ...map };
	}
	const next: ExtensionMap = {};
	for (const [ext, rule] of Object.entries(map)) {
		if (!drop.has(ext)) {
			next[ext] = rule;
		}
	}
	return next;
}

/**
 * 把一个图标**扇出**到整组成员，不改动入参。这就是「一起设置图标」的兑现点。
 *
 * 一次调用改完整组，调用方随后**一次整 map 写入**——对比逐行改 N 次（N 次
 * `saveSettings` + N 次 `applyAll`，装了大包时每次是上万次 `addIcon`），
 * 这正是本方案要解决的那个卡顿。
 *
 * `color` 省略时**保留各成员原有颜色**（`undefined` = 未改动，与 `IconPickerModal`
 * 的 `onChange` 第三参同一套约定）；传 `""` 才是显式清除。
 */
export function setGroupIcon(
	map: ExtensionMap,
	group: string,
	icon: string,
	type: IconType,
	color?: string,
): ExtensionMap {
	const members = new Set(groupMembers(map, group));
	if (members.size === 0) {
		return { ...map };
	}
	const next: ExtensionMap = {};
	for (const [ext, rule] of Object.entries(map)) {
		next[ext] = members.has(ext)
			? {
					...rule,
					icon,
					type,
					...(color === undefined ? {} : { color }),
				}
			: rule;
	}
	return next;
}

/**
 * 只把颜色扇出到整组，**各成员图标不动**。
 *
 * 单独一个函数而不是 `setGroupIcon(map, g, uniform.icon, ...)`：组内图标不一致时
 * 后者会把整组图标一并统一成「第一个成员」的那个——用户只是想调个颜色，却顺手
 * 丢掉了自己单独配过的那几行。颜色和图标在组行上是两个控件，就该能分别改。
 */
export function setGroupColor(
	map: ExtensionMap,
	group: string,
	color: string,
): ExtensionMap {
	const members = new Set(groupMembers(map, group));
	if (members.size === 0) {
		return { ...map };
	}
	const next: ExtensionMap = {};
	for (const [ext, rule] of Object.entries(map)) {
		next[ext] = members.has(ext) ? { ...rule, color } : rule;
	}
	return next;
}

/**
 * 组内图标是否一致，以及一致时是哪一个。
 *
 * 三种返回：
 * - `null` —— 组不存在 / 没有成员（调用方不该渲染这一行）；
 * - `{ mixed: false, icon, type, color }` —— 全组一致（`icon` 可能是 `""`，
 *   即整组都还没配图标，此时组行的选择器显示为空，正是骰子最有用的场景）；
 * - `{ mixed: true, ... }` —— 不一致，附**第一个成员**的图标供选择器显示。
 *
 * 颜色参与一致性判定：组行旁边就有颜色控件，若只比图标，改过颜色的组会显示
 * 「一致」却在成员间花色不同，那比不报告更糟。
 */
export interface UniformIcon {
	mixed: boolean;
	icon: string;
	type: IconType;
	color: string;
}

export function uniformIcon(
	map: ExtensionMap,
	group: string,
): UniformIcon | null {
	const members = groupMembers(map, group);
	if (members.length === 0) {
		return null;
	}
	// 成员顺序取 Object.keys 的插入序：只用于「混合时显示哪一个」，不承诺稳定语义
	const first = map[members[0]];
	const base: UniformIcon = {
		mixed: false,
		icon: first.icon ?? "",
		type: first.type ?? "lucide",
		color: first.color ?? "",
	};
	for (const ext of members.slice(1)) {
		const rule = map[ext];
		if (
			(rule.icon ?? "") !== base.icon ||
			(rule.type ?? "lucide") !== base.type ||
			(rule.color ?? "") !== base.color
		) {
			return { ...base, mixed: true };
		}
	}
	return base;
}
