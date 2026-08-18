import { AbstractIconHandler } from "@src/util/IconHandler";

interface IExperimentalConfig {
	keepPluginFirst: boolean;
}

/**
 * 实验性：始终保持本插件位于 community-plugins.json 数组首位。
 *
 * 背景：社区插件按该数组的顺序串行加载（无优先级 API），插件加载顺序
 * 直接决定"其他插件启动期引用 CI- 图标是否空白"。每次启用/禁用插件
 * Obsidian 都会重写该数组——本插件被重新启用时会被追加到末尾。
 *
 * 策略：无需监听文件变更。数组顺序只在启动读取时生效，且只有
 * "本插件自身被重新启用"会让本插件失去首位（其他插件启停不影响既有
 * 顺序），而这恰好触发本插件 onload → applyAll → 本处理器修正；
 * 手动外部改写的情况最迟在下次启动的 onload 中被修正。
 *
 * 安全规则：
 * - 仅当本插件已在数组中且不在首位时重写（绝不增删任何条目——
 *   被禁用时本插件已不在数组中，此时绝不能把自己加回去）；
 * - 数组结构异常（非 string 数组 / 解析失败）时不动文件；
 * - 读写经串行队列执行，避免并发交错。
 *
 * 注意：对当前会话无效（启动时 Obsidian 已读取过该文件），下次启动生效。
 */
export default class KeepPluginFirstHandler extends AbstractIconHandler<IExperimentalConfig> {
	readonly id = "experimental";

	constructor(private readonly pluginId: string) {
		super();
	}

	apply(): void {
		if (!this.isEnabled()) {
			return; // 关闭时不做任何事，也无需还原（顺序保持现状）
		}
		this.#enqueueEnforce();
	}

	cleanup(): void {
		// 无持续资源需要清理（不注册监听器）
	}

	isEnabled(): boolean {
		return this.settings?.keepPluginFirst ?? false;
	}

	/** 串行执行修正，避免并发读写交错 */
	#enqueueEnforce(): void {
		this.#enforceChain = this.#enforceChain
			.then(() => this.#enforce())
			.catch((error) => {
				console.warn("[Custom Icons] keep-plugin-first:", error);
			});
	}

	#enforceChain: Promise<void> = Promise.resolve();

	/** 配置目录名可被用户自定义，必须从 vault 动态获取 */
	#getConfigPath(): string {
		return `${this.app.vault.configDir}/community-plugins.json`;
	}

	async #enforce(): Promise<void> {
		const configPath = this.#getConfigPath();
		const adapter = this.app.vault.adapter;
		const raw = await adapter.read(configPath);
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return; // 结构异常，不动文件
		}

		const ids: string[] = [];
		for (const id of parsed) {
			if (typeof id !== "string") {
				return; // 结构异常，不动文件
			}
			ids.push(id);
		}

		if (ids[0] === this.pluginId) {
			return; // 已在首位
		}

		// 安全守卫：本插件不在数组中（已被禁用）时不得自行加回
		if (!ids.includes(this.pluginId)) {
			return;
		}

		const next = [
			this.pluginId,
			...ids.filter((id) => id !== this.pluginId),
		];
		await adapter.write(configPath, JSON.stringify(next));
	}
}
