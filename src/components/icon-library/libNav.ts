/** 图标库视图的页签 */
export type LibTabId = "all" | "pack" | "svg" | "lucide";

export const LIB_TAB_IDS: LibTabId[] = ["all", "pack", "svg", "lucide"];

/**
 * 把落盘的 `ui.lastTab` 收敛成合法页签。
 *
 * `data.json` 是用户可编辑的，而 `SettingsStore#mergeWithDefaults` 只比较
 * 类型不校验取值——任意字符串都会原样进来，直接拿去当 `Tab` 的受控值会
 * 得到「四个页签一个都不高亮、内容区空白」。
 */
export function normalizeLibTab(raw: unknown): LibTabId {
	return LIB_TAB_IDS.includes(raw as LibTabId) ? (raw as LibTabId) : "all";
}

/** 跨页搜索交接：由 CustomIconLibView 传给目标页作为初始查询词 */
export interface LibHandoff {
	query: string;
	/**
	 * 目标是 pack 页时，要直接打开的图标包 id。
	 * 「全部」页里某个包的搜索结果点「查看全部」时用它跳进包详情，而不是停在目录。
	 */
	packId?: string;
}

/** 请求切换到另一页，并把查询词（必要时连同目标图标包）带过去 */
export type LibNavigate = (
	tab: LibTabId,
	query: string,
	packId?: string,
) => void;
