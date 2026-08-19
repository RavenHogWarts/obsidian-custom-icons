import IconPackStore from "@src/service/icon-packs/IconPackStore";
import { sanitizeSvg } from "@src/service/icon-packs/sanitize";
import { packIconId } from "@src/service/icon-packs/types";
import { ICustomIconLib, IIconPackManifest } from "@src/types/types";
import { AbstractIconHandler } from "../util/IconHandler";
import { cleanSvg } from "../util/svgUtils";
import { addIcon, removeIcon } from "obsidian";

export default class CustomIconLibHandler extends AbstractIconHandler<ICustomIconLib> {
	readonly id = "customIconLib";

	/**
	 * 已注册进全局注册表的包 → 其 IIconSet 快照。
	 * 以缓存对象身份判断是否需要（重新）注册：writePack 总是写入新对象，
	 * 因此覆盖安装/更新会自动触发重注册；重复 applyAll 为幂等 no-op。
	 */
	private appliedPacks = new Map<string, IIconSetLike>();

	constructor(private iconPackStore: IconPackStore) {
		super();
	}

	apply(): void {
		// 用户单个 SVG：注册时 sanitize（存储内容不动，仅过滤渲染标记）
		const svgIcons = this.settings?.svg || [];
		for (const icon of svgIcons) {
			if (icon.id && icon.content) {
				const id = icon.id.startsWith("CI-") ? icon.id : `CI-${icon.id}`;
				const content = sanitizeSvg(icon.content) ?? cleanSvg(icon.content);
				addIcon(id, content);
			}
		}

		// 图标库包：enabled 注册 / disabled 注销 / manifest 外残留清理
		const packs = this.settings?.packs ?? {};
		const seen = new Set<string>();
		for (const manifest of Object.values(packs)) {
			seen.add(manifest.id);
			if (manifest.enabled) {
				this.applyPack(manifest);
			} else {
				this.cleanupPack(manifest.id);
			}
		}
		for (const id of Array.from(this.appliedPacks.keys())) {
			if (!seen.has(id)) {
				this.cleanupPack(id);
			}
		}
	}

	private applyPack(manifest: IIconPackManifest): void {
		const pack = this.iconPackStore.getCachedPack(manifest.id);
		if (!pack) {
			// 预载缺失或文件损坏：跳过并告警，不阻断其余注册
			console.warn(
				`[Custom Icons] icon pack "${manifest.id}" not loaded (missing or broken file)`,
			);
			return;
		}
		if (this.appliedPacks.get(manifest.id) === pack) {
			return; // 已注册当前版本
		}
		// 版本更新：先注销旧图标再注册新版本
		this.cleanupPack(manifest.id);
		for (const [name, svg] of Object.entries(pack.icons)) {
			addIcon(packIconId(manifest.id, name), svg);
		}
		this.appliedPacks.set(manifest.id, pack);
	}

	private cleanupPack(packId: string): void {
		const applied = this.appliedPacks.get(packId);
		if (!applied) {
			return;
		}
		for (const name of Object.keys(applied.icons)) {
			removeIcon(packIconId(packId, name));
		}
		this.appliedPacks.delete(packId);
	}

	cleanup(): void {
		const svgIcons = this.settings?.svg || [];
		svgIcons.forEach((icon) => {
			if (icon.id) {
				const id = icon.id.startsWith("CI-")
					? icon.id
					: `CI-${icon.id}`;
				removeIcon(id);
			}
		});
		for (const id of Array.from(this.appliedPacks.keys())) {
			this.cleanupPack(id);
		}
	}

	isEnabled(): boolean {
		return true;
	}
}

/** IIconSet 的结构签名（避免与 service 层类型的循环导入） */
interface IIconSetLike {
	icons: Record<string, string>;
}
