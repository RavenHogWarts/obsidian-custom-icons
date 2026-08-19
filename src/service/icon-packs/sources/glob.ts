/**
 * 极简 glob 匹配器（npm SVG 源专用）
 *
 * 支持语法：
 * - `*`        单段内任意字符（不含 /）
 * - `**`       整段通配：匹配零个或多个目录层级（仅在段位置支持）
 * - `{a,b,c}`  段内多选一（可与其他语法组合，如 `{solid,brands}/*.svg`）
 *
 * 同时计算「字面量前缀」（不含通配的最长前导目录），
 * 用于从文件路径推导图标名：去掉前缀与扩展名、`/` 与非法字符序列折叠为 `-`。
 */

const DOUBLE_STAR = "\u0000";

/** 单段 glob → 正则片段 */
function segmentToRegex(segment: string): string {
	if (segment === "**") {
		return DOUBLE_STAR;
	}
	// 展开 {a,b,c}
	let pattern = "";
	let i = 0;
	while (i < segment.length) {
		const char = segment[i];
		if (char === "{") {
			const end = segment.indexOf("}", i);
			if (end === -1) {
				pattern += escapeRegex(char);
				i++;
				continue;
			}
			const alternatives = segment
				.slice(i + 1, end)
				.split(",")
				.map((alt) => alt.replace(/\*/g, "[^/]*").replace(/[|\\()[\]^$+?.]/g, "\\$&"));
			pattern += `(?:${alternatives.join("|")})`;
			i = end + 1;
		} else if (char === "*") {
			pattern += "[^/]*";
			i++;
		} else if (char === "?") {
			pattern += "[^/]";
			i++;
		} else {
			pattern += escapeRegex(char);
			i++;
		}
	}
	return `(?:${pattern})`;
}

function escapeRegex(char: string): string {
	return /[|\\()[\]^$+?.]/.test(char) ? `\\${char}` : char;
}

export class GlobMatcher {
	private regex: RegExp;
	/** 字面量前缀（如 "svgs"、"icons/outline"），图标名从其后开始截取 */
	readonly literalPrefix: string;

	constructor(glob: string) {
		let normalized = glob.trim().replace(/\\/g, "/").replace(/^\.?\//, "");
		// 尾部裸 ** 等价于 **/*
		if (normalized.endsWith("/**")) {
			normalized += "/*";
		}
		const segments = normalized.split("/").filter(Boolean);
		if (segments.length === 0) {
			throw new Error("Empty glob pattern");
		}

		// 字面量前缀：最长的不含通配/多选的前导段
		let prefixParts: string[] = [];
		for (const segment of segments.slice(0, -1)) {
			if (/[*?{}]/.test(segment)) {
				break;
			}
			prefixParts.push(segment);
		}
		this.literalPrefix = prefixParts.join("/");

		let pattern = "^";
		segments.forEach((segment, index) => {
			const fragment = segmentToRegex(segment);
			if (fragment === DOUBLE_STAR) {
				pattern += "(?:[^/]+/)*";
				return;
			}
			pattern += fragment;
			if (index < segments.length - 1) {
				pattern += "/";
			}
		});
		pattern += "$";
		this.regex = new RegExp(pattern);
	}

	test(path: string): boolean {
		return this.regex.test(path);
	}

	/** 文件路径 → 图标名（相对字面量前缀、去扩展名、非法字符折叠） */
	deriveName(path: string): string {
		let relative = path;
		if (this.literalPrefix && path.startsWith(`${this.literalPrefix}/`)) {
			relative = path.slice(this.literalPrefix.length + 1);
		}
		const withoutExt = relative.replace(/\.[^./]+$/, "");
		const name = withoutExt
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");
		return name || "icon";
	}
}
