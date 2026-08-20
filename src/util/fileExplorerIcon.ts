import {
	IFileExplorerIconOverride,
	IIcon,
	IconType,
} from "@src/types/types";
import { normalizeIconColor } from "@src/util/communityPluginIcon";

/**
 * 文件浏览器图标解析工具。
 *
 * 级联优先级（自顶向下覆盖）：
 * - 文件：  files[path]   ?? extensions[ext] ?? fileDefault
 * - 文件夹：folders[path] ?? folderDefault
 *
 * 任一级 icon 为空视为「未设置」，最终解析结果 icon 为空时返回 null，
 * 语义为「该项不显示图标」（避免给全库文件/夹强插图标造成视觉噪音）。
 */

export interface IFileExplorerConfig {
	enable: boolean;
	folderDefault: IIcon;
	folders: Record<string, IFileExplorerIconOverride>;
	fileDefault: IIcon;
	extensions: Record<string, IFileExplorerIconOverride>;
	files: Record<string, IFileExplorerIconOverride>;
}

/**
 * 从 vault 相对路径截取扩展名（小写、去点）。
 * 无扩展名或以点开头的隐藏文件（如 ".gitignore"）返回空串。
 */
export function getExtension(path: string): string {
	const slash = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
	const dot = path.lastIndexOf(".");
	// dot 必须在最后一个分隔符之后，且不是紧跟分隔符（隐藏文件）
	if (dot <= slash + 1) return "";
	return path.slice(dot + 1).toLowerCase();
}

/** 扩展名归一化：小写、去除前导点、trim */
export function normalizeExtensionKey(ext: string): string {
	return ext.trim().replace(/^\.+/, "").toLowerCase();
}

function hasIcon(
	override?: IFileExplorerIconOverride | IIcon,
): override is IFileExplorerIconOverride {
	return Boolean(override && override.icon && override.type);
}

function toIcon(
	id: string,
	source: IFileExplorerIconOverride | IIcon,
): IIcon {
	return {
		id,
		icon: source.icon ?? "",
		type: (source.type as IconType) ?? "lucide",
		color: normalizeIconColor(source.color) ?? "",
	};
}

/**
 * 解析文件图标：files[path] ?? extensions[ext] ?? fileDefault。
 * 无匹配（或匹配项 icon 为空）返回 null。
 */
export function resolveFileIcon(
	path: string,
	cfg: IFileExplorerConfig,
): IIcon | null {
	const fileOverride = cfg.files?.[path];
	if (hasIcon(fileOverride)) return toIcon(path, fileOverride);

	const ext = getExtension(path);
	const extOverride = ext ? cfg.extensions?.[ext] : undefined;
	if (hasIcon(extOverride)) return toIcon(path, extOverride);

	if (hasIcon(cfg.fileDefault)) return toIcon(path, cfg.fileDefault);

	return null;
}

/**
 * 解析文件夹图标：folders[path] ?? folderDefault。
 * 无匹配（或匹配项 icon 为空）返回 null。
 */
export function resolveFolderIcon(
	path: string,
	cfg: IFileExplorerConfig,
): IIcon | null {
	const folderOverride = cfg.folders?.[path];
	if (hasIcon(folderOverride)) return toIcon(path, folderOverride);

	if (hasIcon(cfg.folderDefault)) return toIcon(path, cfg.folderDefault);

	return null;
}

/**
 * 路径迁移：把 oldPath（及其作为文件夹时的所有子项）在 map 中迁移到 newPath。
 * 用于 vault rename——纯函数，返回新 map（不改原对象），便于单测。
 *
 * @param isFolder 为 true 时，同时迁移前缀为 `oldPath + "/"` 的所有子项键
 */
export function migrateFileExplorerPaths(
	map: Record<string, IFileExplorerIconOverride>,
	oldPath: string,
	newPath: string,
	isFolder: boolean,
): Record<string, IFileExplorerIconOverride> {
	const next: Record<string, IFileExplorerIconOverride> = {};
	const oldPrefix = oldPath + "/";
	const newPrefix = newPath + "/";
	let changed = false;

	for (const [key, value] of Object.entries(map)) {
		if (key === oldPath) {
			next[newPath] = { ...value, id: newPath };
			changed = true;
		} else if (isFolder && key.startsWith(oldPrefix)) {
			const migratedKey = newPrefix + key.slice(oldPrefix.length);
			next[migratedKey] = { ...value, id: migratedKey };
			changed = true;
		} else {
			next[key] = value;
		}
	}

	return changed ? next : map;
}
