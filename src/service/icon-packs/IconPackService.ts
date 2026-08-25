import CIPlugin from "@src/main";
import IconPackStore from "@src/service/icon-packs/IconPackStore";
import { IconifySource } from "@src/service/icon-packs/sources/IconifySource";
import { NpmSvgSource } from "@src/service/icon-packs/sources/NpmSvgSource";
import {
	FetchContext,
	IIconSet,
	IIconSource,
	validatePackId,
} from "@src/service/icon-packs/types";
import {
	IIconPackManifest,
	IconSourceConfig,
} from "@src/types/types";
import { forgetPackIcons } from "@src/util/iconRefCleanup";
import { removeIcon } from "obsidian";
import { packIconId } from "./types";

export interface InstallOptions extends FetchContext {
	/** npm-svg 源没有自带 id（Iconify 用 prefix），必须显式指定包 id */
	packId?: string;
	/** 展示名覆盖 */
	name?: string;
	license?: string;
}

/**
 * 图标库安装/卸载编排
 *
 * 网络**只**出现在这里发起的显式安装/更新动作中（离线不变式 O1）；
 * 安装完成后经 settingsStore.updateSettingByPath → saveSettings → applyAll，
 * 由 CustomIconLibHandler 从 IconPackStore 缓存同步注册，立即生效。
 */
export default class IconPackService {
	private iconify: IconifySource;
	private npmSvg = new NpmSvgSource();

	constructor(private plugin: CIPlugin) {
		this.iconify = new IconifySource(plugin.iconPackStore);
	}

	get store(): IconPackStore {
		return this.plugin.iconPackStore;
	}

	private getSource(config: IconSourceConfig): IIconSource {
		return config.type === "iconify" ? this.iconify : this.npmSvg;
	}

	/** 浏览 Iconify 图标集目录（带落盘缓存，离线不变式 O3） */
	async getIconifyCatalog(force = false) {
		return this.iconify.fetchCatalog(force);
	}

	/** 下载前预览 Iconify 集的样例图标（官方 ?icons= 子集端点，体量极小） */
	async previewIconify(
		prefix: string,
		samples: string[],
	): Promise<Record<string, string>> {
		return this.iconify.preview(prefix, samples);
	}

	/** 下载前预览 npm 包匹配的前若干个 SVG */
	async previewNpmSvg(
		config: IconSourceConfig,
	): Promise<Record<string, string>> {
		return this.npmSvg.preview(config);
	}

	/**
	 * 安装（或覆盖更新）一个图标库
	 * @returns 写入 settings 的 manifest
	 */
	async install(
		config: IconSourceConfig,
		options: InstallOptions = {},
	): Promise<IIconPackManifest> {
		const packId = (options.packId ?? (config.type === "iconify" ? config.prefix : ""))
			.trim()
			.toLowerCase();

		const idError = validatePackId(packId);
		if (idError === "invalid") {
			throw new Error(`Invalid pack id "${packId}" (lowercase letters, digits and hyphens)`);
		}
		if (idError === "reserved") {
			throw new Error(`Pack id "${packId}" is reserved`);
		}

		const iconSet = await this.getSource(config).fetch(config, options);
		// 取消检查：Iconify 单包是一次性大 JSON，无法中途中断，但可在写盘前拦下——
		// 保证"点了取消就不留半个包"（npm-svg 源在 mapWithConcurrency 里已协作式提前返回）
		if (options.signal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}
		const finalSet: IIconSet = {
			...iconSet,
			id: packId,
			name: options.name?.trim() || iconSet.name || packId,
			license: options.license || iconSet.license,
		};

		// 先落盘（store 缓存同步更新，供随后的 applyAll 使用）
		await this.store.writePack(finalSet);

		// 覆盖更新（重新下载）时保留原启用状态与安装时间：
		// 重装不应意外重新启用已停用的包，也不应打乱已安装列表顺序。
		const existing = this.plugin.settings.customIconLib.packs[packId];
		const manifest: IIconPackManifest = {
			id: packId,
			name: finalSet.name,
			version: finalSet.version,
			license: finalSet.license,
			iconCount: Object.keys(finalSet.icons).length,
			enabled: existing?.enabled ?? true,
			installedAt: existing?.installedAt ?? Date.now(),
			source: config,
		};
		await this.plugin.settingsStore.updateSettingByPath(
			`customIconLib.packs.${packId}`,
			manifest,
		);
		return manifest;
	}

	/** 卸载：注销已注册图标 → 删文件 → 删 manifest */
	async uninstall(packId: string): Promise<void> {
		const pack =
			this.store.getCachedPack(packId) ??
			(await this.store.readPack(packId));
		if (pack) {
			for (const name of Object.keys(pack.icons)) {
				removeIcon(packIconId(packId, name));
			}
		}
		await this.store.removePack(packId);
		await this.plugin.settingsStore.deleteSettingByPath(
			`customIconLib.packs.${packId}`,
		);
		// 收藏 / 最近里指向该包的键随之作废（停用则不清——那是可逆的）
		await forgetPackIcons(this.plugin.settingsStore, packId);
	}

	/** 启停：更新 manifest 后由 applyAll 注册/注销 */
	async setEnabled(packId: string, enabled: boolean): Promise<void> {
		const current = this.plugin.settings.customIconLib.packs[packId];
		if (!current) {
			return;
		}
		const packs = { ...this.plugin.settings.customIconLib.packs };
		packs[packId] = { ...current, enabled };
		await this.plugin.settingsStore.updateSettingByPath(
			"customIconLib.packs",
			packs,
		);
	}
}
