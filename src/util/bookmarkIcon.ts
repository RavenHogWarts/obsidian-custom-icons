import {
	BookmarkKind,
	IBookmarkIconOverride,
	IIcon,
	IconType,
} from "@src/types/types";
import { normalizeIconColor } from "@src/util/communityPluginIcon";

/**
 * 书签图标解析工具。
 *
 * 两层模型（与插件其它功能同构：类型默认层是一等兜底，同 fileExplorer.folderDefault；
 * 右键单项覆盖叠加于上）：
 * - 每一行：items[ctime] ?? types[kind] ?? null
 *
 * 单项键用书签的 `ctime`（稳定 id，重命名/移动不失效），而非 DOM 的 data-path
 * （标题拼路径、随重命名而变）；故无需 rename 迁移逻辑。
 *
 * 任一级 icon 为空视为「未设置」，最终解析为 null，
 * 语义为「保持该行原生外观」（叶子项保留其原生图标、组保留仅折叠三角）。
 */

/** 六种书签类型的固定顺序（设置页「按类型」区逐行渲染用） */
export const BOOKMARK_KINDS: readonly BookmarkKind[] = [
	"file",
	"folder",
	"group",
	"search",
	"graph",
	"url",
];

export interface IBookmarksConfig {
	enable: boolean;
	/** 单项覆盖，key = String(ctime) */
	items: Record<string, IBookmarkIconOverride>;
	/** 类型默认，key = BookmarkKind */
	types: Record<string, IBookmarkIconOverride>;
}

/** 是否为合法书签类型键（归一化 / 兜底判定用） */
export function isBookmarkKind(value: string): value is BookmarkKind {
	return (BOOKMARK_KINDS as readonly string[]).includes(value);
}

function hasIcon(
	override?: IBookmarkIconOverride | IIcon,
): override is IBookmarkIconOverride {
	return Boolean(override && override.icon && override.type);
}

function toIcon(id: string, source: IBookmarkIconOverride | IIcon): IIcon {
	return {
		id,
		icon: source.icon ?? "",
		type: (source.type as IconType) ?? "lucide",
		color: normalizeIconColor(source.color) ?? "",
	};
}

/**
 * 解析某书签行的图标：items[key] ?? types[kind]。
 * 无匹配（或匹配项 icon 为空）返回 null（不动原生）。
 *
 * @param key  单项键（通常为 String(ctime)，缺失模型时可退回 data-path）；undefined 则跳过单项层
 * @param kind 书签类型
 */
export function resolveBookmarkIcon(
	key: string | undefined,
	kind: BookmarkKind,
	cfg: IBookmarksConfig,
): IIcon | null {
	const itemOverride = key ? cfg.items?.[key] : undefined;
	if (hasIcon(itemOverride)) return toIcon(key as string, itemOverride);

	const typeOverride = cfg.types?.[kind];
	if (hasIcon(typeOverride)) return toIcon(kind, typeOverride);

	return null;
}
