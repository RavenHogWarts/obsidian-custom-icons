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
	// 保留字：只排与用户 SVG 的 CI- 前缀真正冲突的形态。
	//
	// `lucide` 曾在这份名单里，已放开：它注册出来的是 `CI-lucide-<name>`，
	// 与 Obsidian 内置的 `lucide-<name>` **前缀不同、不会冲突**——当初列为保留字
	// 是偏保守的防御，代价却是 Iconify 官方的 `lucide` 集（1780 图标 / ISC）根本装不上
	// （Iconify 安装路径不传 packId，packId 即 prefix = "lucide"，直接抛 reserved）。
	// 放开后正文内联图标想用全量 Lucide 的用户就走既有图标包路径，
	// 见 dev/ecosystem/跨插件API导出方案.md §3.2。
	if (lower === "ci" || lower.startsWith("ci-")) {
		return "reserved";
	}
	return null;
}

/** 库图标的完整注册 id */
export function packIconId(packId: string, name: string): string {
	return `CI-${packId}-${name}`;
}
