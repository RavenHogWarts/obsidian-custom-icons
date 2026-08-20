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
 * - 文件：  files[path] ?? extensions[compoundExt] ?? extensions[ext]
 *           ?? (子文件继承开? 最近祖先文件夹) ?? fileDefault
 * - 文件夹：folders[path] ?? (子文件夹继承开? 最近祖先文件夹) ?? folderDefault
 *
 * 复合后缀（.excalidraw.md）比末段后缀（.md）更具体，优先命中；
 * 继承默认关闭，开启后子项在无自身配置时套用最近祖先文件夹的整套图标（含颜色）。
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
	/** 继承开关：子文件夹 / 子文件 在无自身配置时继承最近祖先文件夹图标 */
	inherit: { subfolder: boolean; file: boolean };
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

/**
 * 复合后缀：文件名「第一个非开头点」之后的全部（小写）。
 * 用于区分 .excalidraw.md 与普通 .md；无复合后缀返回空串。
 *
 * "foo.excalidraw.md" → "excalidraw.md"
 * "a.tar.gz"          → "tar.gz"
 * "note.md"           → "md"（单点时等于末段后缀）
 * ".gitignore"        → ""（开头点后无第二个点）
 */
export function getCompoundExtension(path: string): string {
	const slash = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
	const base = path.slice(slash + 1);
	// 跳过开头连续的点（隐藏文件前缀，如 .env）再找第一个点
	let i = 0;
	while (i < base.length && base[i] === ".") i++;
	const firstDot = base.indexOf(".", i);
	if (firstDot < 0) return "";
	return base.slice(firstDot + 1).toLowerCase();
}

/** 扩展名归一化：小写、去除前导点、trim */
export function normalizeExtensionKey(ext: string): string {
	return ext.trim().replace(/^\.+/, "").toLowerCase();
}

/**
 * 批量解析扩展名输入：按逗号 / 空白分隔，逐个归一化（去前导点、小写、trim），
 * 去空、去重。中间点保留，天然衔接复合后缀（如 "excalidraw.md"）。
 *
 * "xdb .js"        → ["xdb", "js"]
 * ".xdb,.js , md"  → ["xdb", "js", "md"]
 * ".excalidraw.md" → ["excalidraw.md"]
 */
export function parseExtensionInput(raw: string): string[] {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const token of raw.split(/[,\s]+/)) {
		const key = normalizeExtensionKey(token);
		if (key && !seen.has(key)) {
			seen.add(key);
			result.push(key);
		}
	}
	return result;
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
 * 沿 path 逐级向上（不含自身），返回最近一个「已配图标」的祖先文件夹覆盖。
 * 用于子文件夹 / 子文件继承；无命中返回 undefined。
 *
 * 文件夹 "x/y/z"     → 查 "x/y" → "x"
 * 文件 "x/y/note.md" → 查 "x/y" → "x"（文件继承其所在文件夹链）
 */
export function findNearestConfiguredAncestor(
	path: string,
	folders: Record<string, IFileExplorerIconOverride>,
): IFileExplorerIconOverride | undefined {
	let cur = path;
	let slash = cur.lastIndexOf("/");
	while (slash >= 0) {
		cur = cur.slice(0, slash);
		const ancestor = folders[cur];
		if (hasIcon(ancestor)) return ancestor;
		slash = cur.lastIndexOf("/");
	}
	return undefined;
}

/**
 * 解析文件图标：
 * files[path] ?? extensions[compoundExt] ?? extensions[ext]
 *   ?? (inherit.file ? 最近祖先文件夹 : —) ?? fileDefault。
 * 无匹配（或匹配项 icon 为空）返回 null。
 */
export function resolveFileIcon(
	path: string,
	cfg: IFileExplorerConfig,
): IIcon | null {
	const fileOverride = cfg.files?.[path];
	if (hasIcon(fileOverride)) return toIcon(path, fileOverride);

	// 复合后缀（.excalidraw.md）更具体，优先于末段后缀（.md）；两者相同时不多查
	const ext = getExtension(path);
	const compoundExt = getCompoundExtension(path);
	if (compoundExt && compoundExt !== ext) {
		const compoundOverride = cfg.extensions?.[compoundExt];
		if (hasIcon(compoundOverride)) return toIcon(path, compoundOverride);
	}

	const extOverride = ext ? cfg.extensions?.[ext] : undefined;
	if (hasIcon(extOverride)) return toIcon(path, extOverride);

	// 子文件继承：套用最近祖先文件夹图标（默认关，扩展名优先）
	if (cfg.inherit?.file) {
		const ancestor = findNearestConfiguredAncestor(path, cfg.folders ?? {});
		if (hasIcon(ancestor)) return toIcon(path, ancestor);
	}

	if (hasIcon(cfg.fileDefault)) return toIcon(path, cfg.fileDefault);

	return null;
}

/**
 * 解析文件夹图标：
 * folders[path] ?? (inherit.subfolder ? 最近祖先文件夹 : —) ?? folderDefault。
 * 无匹配（或匹配项 icon 为空）返回 null。
 */
export function resolveFolderIcon(
	path: string,
	cfg: IFileExplorerConfig,
): IIcon | null {
	const folderOverride = cfg.folders?.[path];
	if (hasIcon(folderOverride)) return toIcon(path, folderOverride);

	// 子文件夹继承：套用最近祖先文件夹图标（默认关）
	if (cfg.inherit?.subfolder) {
		const ancestor = findNearestConfiguredAncestor(path, cfg.folders ?? {});
		if (hasIcon(ancestor)) return toIcon(path, ancestor);
	}

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
