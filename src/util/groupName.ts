/**
 * 组名的收敛规则，供「我的 SVG 分组」与「扩展名分组」两处共用。
 *
 * 两边的建模是同一个（组名挂在成员身上、没有独立注册表、组名即身份且区分
 * 大小写），因此收敛规则也必须是同一份——否则同样一串输入在两处会得到不同的
 * 组名，而这种不一致只会在用户手改过 `data.json` 之后才暴露出来。
 *
 * 原先这两个函数住在 `svgGroups.ts` 里。抽出来是因为「把用户输入收敛成一个合法
 * 组名」这件事本来就不属于 SVG 图标库——让文件浏览器去 import「SVG 图标库」的
 * 模块，依赖关系读起来是假的。
 */

/** 组名长度上限：组名只用于显示与筛选，不进注册 id，无需限制字符集 */
export const GROUP_NAME_MAX = 64;

/**
 * 收敛用户输入 / 落盘值为合法组名。
 *
 * 非字符串一律当未分组：`data.json` 是用户可手改的，而 `#mergeWithDefaults`
 * 只按 `typeof` 比对**已知字段**，`group` 里可能是数字甚至对象，读到什么都不该抛。
 *
 * **不改大小写**——`Weather` 与 `weather` 是两个组（已确认的需求）。
 */
export function normalizeGroupName(raw: unknown): string {
	if (typeof raw !== "string") {
		return "";
	}
	return raw.trim().slice(0, GROUP_NAME_MAX);
}
