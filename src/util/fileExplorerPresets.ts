import { normalizeExtensionKey } from "./fileExplorerIcon";

/**
 * 扩展名分组的**预设种子**。
 *
 * ⚠️ **只在创建那一刻被读一次，之后就是普通用户数据。** 不跟踪、不同步、不提示
 * 更新、不因为插件升级而变化——否则就要回答「用户删掉的扩展名要不要补回来」
 * 「改过的图标要不要覆盖」这类没有正确答案的问题。往这张表里加扩展名不会影响
 * 任何已创建的分组。
 *
 * 组名同样是**创建时的语言快照**（写入当时语言下的名字，之后换语言不改它），
 * 与 `IIconPackManifest` 存安装时版本快照同一个道理。替代方案是存 `preset: "image"`
 * 再按语言显示，但那给「用户随后改名」挖了个坑（改了名还显示预设名？）。
 */
export interface FileExplorerPreset {
	/** 预设 id：同时是 i18n 键（`settings.fileExplorer.presets.<id>`） */
	id: PresetId;
	/** 建议图标（Lucide 名称；用户创建后可随意改） */
	icon: string;
	/** 该组的扩展名清单 */
	extensions: string[];
}

export type PresetId =
	| "image"
	| "video"
	| "audio"
	| "document"
	| "archive"
	| "code";

/**
 * 清单刻意保守：只收「绝大多数人都会同意属于这一类」的扩展名。
 * 冷门格式留给用户自己加——多收一个的代价是替用户做了他没要的决定。
 */
export const FILE_EXPLORER_PRESETS: readonly FileExplorerPreset[] = [
	{
		id: "image",
		icon: "image",
		extensions: [
			"png",
			"jpg",
			"jpeg",
			"gif",
			"webp",
			"avif",
			"bmp",
			"svg",
			"ico",
			"tiff",
		],
	},
	{
		id: "video",
		icon: "video",
		extensions: ["mp4", "mkv", "mov", "avi", "webm", "flv", "m4v"],
	},
	{
		id: "audio",
		icon: "music",
		extensions: ["mp3", "wav", "flac", "ogg", "m4a", "aac", "opus", "3gp"],
	},
	{
		id: "document",
		icon: "file-text",
		extensions: [
			"pdf",
			"doc",
			"docx",
			"xls",
			"xlsx",
			"ppt",
			"pptx",
			"odt",
			"ods",
			"epub",
			"txt",
			"rtf",
			"csv",
		],
	},
	{
		id: "archive",
		icon: "file-archive",
		extensions: ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "tar.gz"],
	},
	{
		id: "code",
		icon: "file-code",
		extensions: [
			"ts",
			"tsx",
			"js",
			"jsx",
			"py",
			"rs",
			"go",
			"java",
			"c",
			"h",
			"cpp",
			"cs",
			"rb",
			"php",
			"sh",
			"json",
			"yaml",
			"yml",
			"toml",
			"html",
			"css",
		],
	},
];

/** 按 id 取一条预设 */
export function findPreset(id: string): FileExplorerPreset | undefined {
	return FILE_EXPLORER_PRESETS.find((preset) => preset.id === id);
}

/** 一次预设创建的结果：写了哪些、跳过了哪些（跳过要说明，不能静默） */
export interface PresetPlan {
	/** 将新建的扩展名（不在 map 里的） */
	added: string[];
	/**
	 * 因**已属于别的分组**而跳过的扩展名。
	 *
	 * 「一个扩展名只属于一个组」是这套建模的不变式（它只有一个 `group` 字段），
	 * 所以预设不会把别人组里的成员抢过来——抢了等于悄悄改动用户已配好的分组。
	 */
	skipped: string[];
	/**
	 * 已存在但**未分组**的扩展名：并入本组，并保留其现有图标。
	 *
	 * 保留而不是覆盖成预设图标：那是用户明确配过的东西，预设只负责把它归类。
	 */
	adopted: string[];
}

/**
 * 计算一次预设创建的动作，不做任何写入（便于界面先说明、再落盘）。
 *
 * @param existingGroup 已有条目的组名查询（`ruleGroup(map[ext])`）
 */
export function planPreset(
	preset: FileExplorerPreset,
	has: (ext: string) => boolean,
	existingGroup: (ext: string) => string,
	targetGroup: string,
): PresetPlan {
	const plan: PresetPlan = { added: [], skipped: [], adopted: [] };
	for (const raw of preset.extensions) {
		const ext = normalizeExtensionKey(raw);
		if (!ext) {
			continue;
		}
		if (!has(ext)) {
			plan.added.push(ext);
			continue;
		}
		const group = existingGroup(ext);
		if (!group || group === targetGroup) {
			plan.adopted.push(ext);
			continue;
		}
		plan.skipped.push(ext);
	}
	return plan;
}
