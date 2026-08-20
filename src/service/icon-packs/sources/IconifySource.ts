import IconPackStore, {
	CATALOG_CACHE_VERSION,
	ICollectionInfo,
} from "@src/service/icon-packs/IconPackStore";
import { sanitizeSvg } from "@src/service/icon-packs/sanitize";
import {
	FetchContext,
	IIconSet,
	IIconSource,
} from "@src/service/icon-packs/types";
import { IconSourceConfig } from "@src/types/types";
import { fetchJson } from "../network";
import {
	IconifyCollections,
	IconifyJSON,
	iconifyIconToSvg,
	resolveIcon,
} from "./iconifyParse";

const CDN_HOSTS = ["https://cdn.jsdelivr.net/npm", "https://unpkg.com"];

/** Iconify 官方 API 域名（支持 ?icons= 子集端点，用于小体量预览） */
const API_HOSTS = [
	"https://api.iconify.design",
	"https://api.simplesvg.com",
	"https://api.unisvg.com",
];

function iconifySetUrls(prefix: string): string[] {
	return CDN_HOSTS.map(
		(host) => `${host}/@iconify-json/${prefix}@latest/icons.json`,
	);
}

/*
 * 目录源：unpkg 优先——jsdelivr 对 @iconify/json 整包已超 150MB 限制返回 403，
 * 保留 jsdelivr 作为回退镜像。
 */
const CATALOG_URLS = [
	"https://unpkg.com/@iconify/json@latest/collections.json",
	"https://cdn.jsdelivr.net/npm/@iconify/json@latest/collections.json",
];

/**
 * Iconify 数据源（方案 A）
 *
 * 覆盖 220+ 图标集；目录数据带落盘缓存（离线不变式 O3），
 * 单集 JSON 从 CDN 镜像下载（jsdelivr → unpkg 回退）。
 */
export class IconifySource implements IIconSource {
	constructor(private store: IconPackStore) {}

	/**
	 * 获取图标集目录（优先读缓存）
	 * @param force 为 true 时跳过缓存强制刷新
	 */
	async fetchCatalog(
		force = false,
	): Promise<{
		collections: ICollectionInfo[];
		fromCache: boolean;
		fetchedAt: number;
	}> {
		const cached = force ? null : await this.store.readCatalog();
		// 版本不符的旧缓存（如无 samples 字段）视为过期，重新拉取后落盘迁移
		if (
			cached &&
			cached.version === CATALOG_CACHE_VERSION &&
			cached.collections?.length
		) {
			return {
				collections: cached.collections,
				fromCache: true,
				fetchedAt: cached.fetchedAt,
			};
		}

		const raw = await fetchJson<IconifyCollections>(CATALOG_URLS);
		const collections: ICollectionInfo[] = Object.entries(raw)
			.map(([prefix, info]) => ({
				prefix,
				name: info.name ?? prefix,
				total: info.total,
				version: info.version,
				license: info.license
					? { title: info.license.title, spdx: info.license.spdx }
					: undefined,
				samples: info.samples?.slice(0, 12),
			}))
			.sort((a, b) => a.name.localeCompare(b.name));

		await this.store.writeCatalog(collections);
		return { collections, fromCache: false, fetchedAt: Date.now() };
	}

	async fetch(config: IconSourceConfig, ctx: FetchContext): Promise<IIconSet> {
		if (config.type !== "iconify") {
			throw new Error("IconifySource expects an iconify config");
		}
		const prefix = config.prefix;

		ctx.onProgress?.(0, 1);
		const json = await fetchJson<IconifyJSON>(iconifySetUrls(prefix));
		if (json.prefix !== prefix) {
			throw new Error(
				`Unexpected prefix "${json.prefix}" (expected "${prefix}")`,
			);
		}

		const icons: Record<string, string> = {};
		let dropped = 0;
		// 真实图标 + 别名统一走 resolveIcon 解链
		for (const name of [
			...Object.keys(json.icons),
			...Object.keys(json.aliases ?? {}),
		]) {
			const resolved = resolveIcon(json, name);
			if (!resolved) {
				dropped++;
				continue;
			}
			const svg = sanitizeSvg(iconifyIconToSvg(resolved));
			if (svg) {
				icons[name] = svg;
			} else {
				dropped++;
			}
		}
		ctx.onProgress?.(1, 1);

		if (Object.keys(icons).length === 0) {
			throw new Error(`No valid icons parsed for prefix "${prefix}"`);
		}
		if (dropped > 0) {
			console.warn(
				`[Custom Icons] Iconify set "${prefix}": dropped ${dropped} invalid/unresolvable entries`,
			);
		}

		return {
			id: prefix,
			name: json.info?.name ?? prefix,
			version: json.info?.version,
			license: json.info?.license?.title ?? json.info?.license?.spdx,
			icons,
		};
	}

	/**
	 * 下载前预览：按名称拉取少量样例图标（走 ?icons= 子集端点，体量极小）
	 * @returns 名称 → 已 sanitize 的 SVG
	 */
	async preview(
		prefix: string,
		names: string[],
	): Promise<Record<string, string>> {
		const list = names.filter(Boolean).slice(0, 12).sort();
		if (list.length === 0) {
			return {};
		}
		const urls = API_HOSTS.map(
			(host) => `${host}/${prefix}.json?icons=${list.join(",")}`,
		);
		const json = await fetchJson<IconifyJSON>(urls);

		const result: Record<string, string> = {};
		for (const name of list) {
			const resolved = resolveIcon(json, name);
			if (!resolved) {
				continue;
			}
			const svg = sanitizeSvg(iconifyIconToSvg(resolved));
			if (svg) {
				result[name] = svg;
			}
		}
		return result;
	}
}
