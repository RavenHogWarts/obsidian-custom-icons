import { IIconPackManifest } from "@src/types/types";
import { DataAdapter } from "obsidian";
import { IIconSet } from "./types";
import { packIconId } from "./types";

/** Iconify 图标集目录条目（collections.json 精简后的缓存结构） */
export interface ICollectionInfo {
	prefix: string;
	name: string;
	total?: number;
	version?: string;
	license?: { title?: string; spdx?: string };
	/** 官方精选样例图标名（下载前预览用） */
	samples?: string[];
}

/** 图标集目录的落盘缓存（离线不变式 O3） */
export interface ICatalogCache {
	fetchedAt: number;
	collections: ICollectionInfo[];
}

/**
 * 图标库文件存储
 *
 * 磁盘布局（pluginDir 为插件目录）：
 *   {pluginDir}/icon-packs/<packId>.json   单文件单包，自包含（离线不变式 O2）
 *   {pluginDir}/icon-packs/catalog.json    图标集目录缓存
 *
 * 所有读写经 vault.adapter（移动端兼容）；首次读取后驻留内存缓存，
 * 保证 CustomIconLibHandler.apply() 的同步注册与 IconPicker 的同步列表可用。
 */
export default class IconPackStore {
	private cache = new Map<string, IIconSet | null>();
	private catalog: ICatalogCache | null | undefined;

	constructor(
		private adapter: DataAdapter,
		private packDir: string,
	) {}

	private packPath(id: string): string {
		return `${this.packDir}/${id}.json`;
	}

	private get catalogPath(): string {
		return `${this.packDir}/catalog.json`;
	}

	async ensureDir(): Promise<void> {
		if (!(await this.adapter.exists(this.packDir))) {
			await this.adapter.mkdir(this.packDir);
		}
	}

	/**
	 * 读取图标包（带内存缓存；文件缺失/损坏时缓存 null 并告警，不抛出）
	 */
	async readPack(id: string): Promise<IIconSet | null> {
		if (this.cache.has(id)) {
			return this.cache.get(id) ?? null;
		}
		let result: IIconSet | null = null;
		try {
			const path = this.packPath(id);
			if (await this.adapter.exists(path)) {
				result = JSON.parse(await this.adapter.read(path)) as IIconSet;
				if (!result || typeof result !== "object" || !result.icons) {
					result = null;
				}
			}
		} catch (error) {
			console.warn(`[Custom Icons] Failed to read icon pack "${id}":`, error);
			result = null;
		}
		this.cache.set(id, result);
		return result;
	}

	/** 同步读取缓存（未加载过时为 null） */
	getCachedPack(id: string): IIconSet | null {
		return this.cache.get(id) ?? null;
	}

	/** 同步收集已启用包的全部图标完整 id（CI-{packId}-{name}），供 IconPicker 使用 */
	getEnabledIconIds(packs: Record<string, IIconPackManifest>): string[] {
		const ids: string[] = [];
		for (const manifest of Object.values(packs)) {
			if (!manifest.enabled) {
				continue;
			}
			const pack = this.getCachedPack(manifest.id);
			if (!pack) {
				continue;
			}
			for (const name of Object.keys(pack.icons)) {
				ids.push(packIconId(manifest.id, name));
			}
		}
		return ids;
	}

	/** 预载全部 manifest 声明的包（启动时调用一次，使缓存就绪） */
	async preload(packs: Record<string, IIconPackManifest>): Promise<void> {
		await Promise.all(Object.values(packs).map((m) => this.readPack(m.id)));
	}

	async writePack(iconSet: IIconSet): Promise<void> {
		await this.ensureDir();
		await this.adapter.write(
			this.packPath(iconSet.id),
			JSON.stringify(iconSet),
		);
		this.cache.set(iconSet.id, iconSet);
	}

	/** 删除包文件；同时清缓存与目录缓存中可能的残留 */
	async removePack(id: string): Promise<void> {
		const path = this.packPath(id);
		try {
			if (await this.adapter.exists(path)) {
				await this.adapter.remove(path);
			}
		} catch (error) {
			console.warn(`[Custom Icons] Failed to remove icon pack "${id}":`, error);
		}
		this.cache.delete(id);
	}

	async readCatalog(): Promise<ICatalogCache | null> {
		if (this.catalog !== undefined) {
			return this.catalog;
		}
		try {
			if (await this.adapter.exists(this.catalogPath)) {
				this.catalog = JSON.parse(
					await this.adapter.read(this.catalogPath),
				) as ICatalogCache;
			} else {
				this.catalog = null;
			}
		} catch (error) {
			console.warn("[Custom Icons] Failed to read icon catalog cache:", error);
			this.catalog = null;
		}
		return this.catalog;
	}

	async writeCatalog(collections: ICollectionInfo[]): Promise<void> {
		const cache: ICatalogCache = { fetchedAt: Date.now(), collections };
		await this.ensureDir();
		await this.adapter.write(this.catalogPath, JSON.stringify(cache));
		this.catalog = cache;
	}
}
