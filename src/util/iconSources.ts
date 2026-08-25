import CIPlugin from "@src/main";
import { LL } from "@src/i18n/i18n";
import { getLucideIconNames } from "./getLucideIcons";
import { IconRef } from "./iconRef";

/**
 * 一个图标来源分组：Lucide、用户导入的 SVG、以及每个已启用图标包各一段。
 *
 * 关键是**按来源分段**而不是把所有包摊平成一个大数组：选择器与「全部」页
 * 都按段检索，单次扫描规模是一个包而不是全部图标
 * （见 dev/260825/图标库UI-UX分析与改进方案.md §1.2 与 §10.2）。
 */
export interface IconSource {
	/** `"lucide"` | `"svg"` | `` `pack:${packId}` `` */
	id: string;
	label: string;
	entries: IconRef[];
	/** 与 entries 同序的**小写**搜索键：预先归一化，避免每次按键重算 toLowerCase */
	keys: string[];
}

export function makeIconSource(
	id: string,
	label: string,
	entries: IconRef[],
): IconSource {
	return {
		id,
		label,
		entries,
		keys: entries.map((entry) => entry.id.toLowerCase()),
	};
}

/**
 * 构建全部图标来源分组。
 *
 * 只读取内存缓存（`getPackIconIds` 走 `getCachedPack`），不产生 IO / 网络；
 * 调用方应当每次打开界面构建一次而不是每次渲染都建。
 */
export function buildIconSources(plugin: CIPlugin): IconSource[] {
	const picker = LL.view.CustomIconLib.picker;
	const lib = plugin.settings.customIconLib;

	const sources: IconSource[] = [
		makeIconSource(
			"lucide",
			picker.segment.lucide(),
			getLucideIconNames().map((id) => ({ type: "lucide" as const, id })),
		),
		makeIconSource(
			"svg",
			picker.segment.svg(),
			lib.svg.map((icon) => ({ type: "svg" as const, id: icon.id })),
		),
	];

	for (const manifest of Object.values(lib.packs)) {
		if (!manifest.enabled) {
			continue;
		}
		sources.push(
			makeIconSource(
				`pack:${manifest.id}`,
				manifest.name,
				plugin.iconPackStore
					.getPackIconIds(manifest.id)
					.map((id) => ({ type: "svg" as const, id })),
			),
		);
	}

	return sources;
}
