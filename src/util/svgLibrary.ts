import { ICustomSVGIcon } from "@src/types/types";

/** 导出文件的结构版本：字段演进时 +1，导入端据此判断能否识别 */
export const SVG_LIBRARY_EXPORT_VERSION = 1;

export interface ISvgLibraryExport {
	version: number;
	icons: ICustomSVGIcon[];
}

/** 「我的 SVG」页的排序方式 */
export type SvgSortMode = "name-asc" | "name-desc" | "added-desc";

export const SVG_SORT_MODES: SvgSortMode[] = [
	"name-asc",
	"name-desc",
	"added-desc",
];

/** 循环到下一个排序方式（工具栏单按钮轮换用） */
export function nextSvgSortMode(mode: SvgSortMode): SvgSortMode {
	const at = SVG_SORT_MODES.indexOf(mode);
	return SVG_SORT_MODES[(at + 1) % SVG_SORT_MODES.length];
}

/**
 * 按指定方式排序（不改动入参）。
 *
 * `added-desc` 的兜底：旧数据没有 `addedAt`，一律视作 0，此时按**数组下标倒序**
 * 排——数组顺序就是插入顺序，倒过来正好是「越晚加的越靠前」。
 */
export function sortSvgIcons(
	icons: ICustomSVGIcon[],
	mode: SvgSortMode,
): ICustomSVGIcon[] {
	const indexed = icons.map((icon, index) => ({ icon, index }));

	indexed.sort((a, b) => {
		if (mode === "added-desc") {
			const diff = (b.icon.addedAt ?? 0) - (a.icon.addedAt ?? 0);
			return diff !== 0 ? diff : b.index - a.index;
		}
		const byName = a.icon.id.localeCompare(b.icon.id);
		return mode === "name-asc" ? byName : -byName;
	});

	return indexed.map((entry) => entry.icon);
}

/** 序列化为导出文件内容（带缩进，便于人工查看与 diff） */
export function serializeSvgLibrary(icons: ICustomSVGIcon[]): string {
	const payload: ISvgLibraryExport = {
		version: SVG_LIBRARY_EXPORT_VERSION,
		icons,
	};
	return JSON.stringify(payload, null, 2);
}

/** 导出文件名：`custom-icons-YYYYMMDD-HHmmss.json` */
export function svgLibraryExportName(now: Date): string {
	const pad = (value: number) => String(value).padStart(2, "0");
	const stamp = [
		now.getFullYear(),
		pad(now.getMonth() + 1),
		pad(now.getDate()),
		"-",
		pad(now.getHours()),
		pad(now.getMinutes()),
		pad(now.getSeconds()),
	].join("");
	return `custom-icons-${stamp}.json`;
}

/**
 * 解析导出文件。
 *
 * 宽容读取：只要能认出 `icons` 数组里的 `{id, content}` 就收下，逐条丢弃脏项；
 * 结构完全不认识（不是对象 / 没有 icons 数组 / 版本号更高）时返回 null。
 * SVG 内容是否合法由调用方逐条校验（与上传文件走同一条路）。
 */
export function parseSvgLibrary(text: string): ICustomSVGIcon[] | null {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		return null;
	}

	if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
		return null;
	}
	const payload = raw as Partial<ISvgLibraryExport>;
	if (!Array.isArray(payload.icons)) {
		return null;
	}
	// 版本号缺失视为 1（早期手写文件）；高于当前版本则不认识
	const version = typeof payload.version === "number" ? payload.version : 1;
	if (version > SVG_LIBRARY_EXPORT_VERSION) {
		return null;
	}

	const icons: ICustomSVGIcon[] = [];
	for (const entry of payload.icons) {
		if (!entry || typeof entry !== "object") {
			continue;
		}
		const { id, content, addedAt } = entry as Partial<ICustomSVGIcon>;
		if (typeof id !== "string" || typeof content !== "string") {
			continue;
		}
		if (!id.trim() || !content.trim()) {
			continue;
		}
		icons.push({
			id: id.trim(),
			content: content.trim(),
			...(typeof addedAt === "number" ? { addedAt } : {}),
		});
	}

	return icons;
}
