/** 图标库视图的三个页签 */
export type LibTabId = "pack" | "svg" | "lucide";

/** 跨页搜索交接：由 CustomIconLibView 传给目标页作为初始查询词 */
export interface LibHandoff {
	query: string;
}

/** 请求切换到另一页，并把查询词带过去 */
export type LibNavigate = (tab: LibTabId, query: string) => void;
