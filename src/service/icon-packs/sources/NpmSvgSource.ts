import { fetchJson, fetchText, mapWithConcurrency } from "../network";
import { sanitizeSvg } from "../sanitize";
import { FetchContext, IIconSet, IIconSource } from "../types";
import { IconSourceConfig } from "@src/types/types";
import { GlobMatcher } from "./glob";

/* jsdelivr 数据 API 的文件树节点 */
interface JsdelivrNode {
	name: string;
	type: "file" | "directory";
	files?: JsdelivrNode[];
}

interface JsdelivrPackage {
	files: JsdelivrNode[];
}

/** 单包图标数上限（规模守卫：MDI ~7400 在限内，fluent-emoji 等超大集拒绝） */
const MAX_ICONS = 8000;
const FETCH_CONCURRENCY = 6;

function flattenFiles(nodes: JsdelivrNode[], base = ""): string[] {
	const paths: string[] = [];
	for (const node of nodes) {
		const path = base ? `${base}/${node.name}` : node.name;
		if (node.type === "directory") {
			paths.push(...flattenFiles(node.files ?? [], path));
		} else {
			paths.push(path);
		}
	}
	return paths;
}

/** 解析包的最新版本号（jsdelivr resolved → unpkg package.json 回退） */
async function resolveLatestVersion(pkg: string): Promise<string> {
	try {
		const res = await fetchJson<{ version: string }>([
			`https://data.jsdelivr.com/v1/packages/npm/${pkg}/resolved?specifier=latest`,
		]);
		if (res.version) {
			return res.version;
		}
	} catch {
		// 落到 unpkg 回退
	}
	const manifest = await fetchJson<{ version: string }>([
		`https://unpkg.com/${pkg}/package.json`,
	]);
	if (!manifest.version) {
		throw new Error(`Cannot resolve version of "${pkg}"`);
	}
	return manifest.version;
}

/** 文件树 → 匹配 glob 的 SVG 路径列表 */
async function listSvgFiles(
	pkg: string,
	version: string,
	glob: string,
): Promise<{ matcher: GlobMatcher; files: string[] }> {
	const matcher = new GlobMatcher(glob);
	const tree = await fetchJson<JsdelivrPackage>([
		`https://data.jsdelivr.com/v1/packages/npm/${encodeURIComponent(pkg)}@${version}`,
	]);
	const allFiles = flattenFiles(tree.files ?? []);
	return {
		matcher,
		files: allFiles.filter(
			(path) =>
				path.toLowerCase().endsWith(".svg") && matcher.test(path),
		),
	};
}

/**
 * npm 散装 SVG 数据源（方案 B）
 *
 * 按「包名 + 版本 + 路径 glob」从 CDN 抓取包内散装 SVG：
 * 文件清单走 jsdelivr 数据 API，SVG 内容 jsdelivr → unpkg 回退，
 * 有限并发 + 进度回调 + 协作式取消。
 */
export class NpmSvgSource implements IIconSource {
	async fetch(
		config: IconSourceConfig,
		ctx: FetchContext,
	): Promise<IIconSet> {
		if (config.type !== "npm-svg") {
			throw new Error("NpmSvgSource expects an npm-svg config");
		}
		const pkg = config.package;
		const version =
			config.version || (await resolveLatestVersion(pkg));
		const { matcher, files: svgFiles } = await listSvgFiles(
			pkg,
			version,
			config.glob,
		);
		if (svgFiles.length === 0) {
			throw new Error(
				`No SVG files matched "${config.glob}" in ${pkg}@${version}`,
			);
		}
		if (svgFiles.length > MAX_ICONS) {
			throw new Error(
				`Matched ${svgFiles.length} SVG files (limit ${MAX_ICONS}). Narrow the glob pattern.`,
			);
		}

		const icons = await this.fetchFiles(pkg, version, matcher, svgFiles, ctx);
		if (ctx.signal?.aborted) {
			throw new Error("Aborted");
		}
		if (Object.keys(icons).length === 0) {
			throw new Error(`No valid SVG parsed from ${pkg}@${version}`);
		}

		return {
			id: "", // 由调用方（预设 id 或用户输入）指定
			name: pkg,
			version,
			icons,
		};
	}

	/**
	 * 下载前预览：文件树取前若干个匹配文件，抓取少量 SVG
	 * @returns 图标名 → 已 sanitize 的 SVG
	 */
	async preview(
		config: IconSourceConfig,
		limit = 12,
	): Promise<Record<string, string>> {
		if (config.type !== "npm-svg") {
			throw new Error("NpmSvgSource expects an npm-svg config");
		}
		const pkg = config.package;
		const version =
			config.version || (await resolveLatestVersion(pkg));
		const { matcher, files: svgFiles } = await listSvgFiles(
			pkg,
			version,
			config.glob,
		);
		if (svgFiles.length === 0) {
			return {};
		}
		return this.fetchFiles(
			pkg,
			version,
			matcher,
			svgFiles.slice(0, limit),
			{},
		);
	}

	/** 并发抓取 + sanitize 一批 SVG 文件，返回 名称 → SVG */
	private async fetchFiles(
		pkg: string,
		version: string,
		matcher: GlobMatcher,
		files: string[],
		ctx: FetchContext,
	): Promise<Record<string, string>> {
		const icons: Record<string, string> = {};
		let dropped = 0;
		await mapWithConcurrency(
			files,
			FETCH_CONCURRENCY,
			async (path) => {
				const content = await fetchText([
					`https://cdn.jsdelivr.net/npm/${pkg}@${version}/${path}`,
					`https://unpkg.com/${pkg}@${version}/${path}`,
				]);
				const svg = sanitizeSvg(content);
				const name = matcher.deriveName(path);
				if (svg && name) {
					// 同名冲突（极少见）：后者加 -2 后缀避免覆盖
					let unique = name;
					let suffix = 2;
					while (icons[unique] !== undefined) {
						unique = `${name}-${suffix++}`;
					}
					icons[unique] = svg;
				} else {
					dropped++;
				}
			},
			ctx.onProgress,
			ctx.signal,
		);
		if (dropped > 0) {
			console.warn(
				`[Custom Icons] npm-svg "${pkg}": dropped ${dropped} invalid files`,
			);
		}
		return icons;
	}
}
