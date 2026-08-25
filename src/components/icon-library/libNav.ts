/** 图标库视图的页签 */
export type LibTabId = "all" | "pack" | "svg" | "lucide";

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
