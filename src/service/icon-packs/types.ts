import { IconSourceConfig } from "@src/types/types";

/** 所有数据源统一产出的图标集中间表示（也是 icon-packs/<id>.json 的文件结构） */
export interface IIconSet {
	/** 包 id（唯一，作命名空间） */
	id: string;
	name: string;
	version?: string;
	license?: string;
	/** 图标名 → 完整 SVG 字符串（已 sanitize） */
	icons: Record<string, string>;
}

/** 数据源拉取上下文 */
export interface FetchContext {
	onProgress?: (done: number, total: number) => void;
	/** 协作式取消：数据源在每个可中断点检查并尽快返回 */
	signal?: AbortSignal;
}

/** 数据源适配器统一接口 */
export interface IIconSource {
	fetch(config: IconSourceConfig, ctx: FetchContext): Promise<IIconSet>;
}

/** 安全校验包 id：合法字符、非保留字 */
export function validatePackId(id: string): string | null {
	if (!/^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z][a-z0-9]*$/i.test(id)) {
		return "invalid";
	}
	const lower = id.toLowerCase();
	// 保留字：与用户 SVG 的 CI- 前缀和 Obsidian 内置前缀冲突
	if (lower === "ci" || lower.startsWith("ci-") || lower === "lucide") {
		return "reserved";
	}
	return null;
}

/** 库图标的完整注册 id */
export function packIconId(packId: string, name: string): string {
	return `CI-${packId}-${name}`;
}
