import { App } from "obsidian";
import { IIconHandler } from "./IconHandler";

/**
 * 图标管理器
 * 负责注册、管理和协调所有图标处理器
 */
export default class IconManager {
	private app: App;
	// 使用类型擦除，让每个 handler 自己处理类型安全
	private handlers: Map<string, IIconHandler<unknown>> = new Map();
	private settings: Record<string, unknown> = {};

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * 注册图标处理器
	 * @param handler 图标处理器实例
	 */
	registerHandler<T>(handler: IIconHandler<T>): void {
		if (this.handlers.has(handler.id)) {
			console.warn(
				`Icon handler with id "${handler.id}" is already registered.`,
			);
			return;
		}
		// 类型擦除：运行时不需要知道具体类型
		this.handlers.set(handler.id, handler);
	}

	/**
	 * 取消注册图标处理器
	 * @param handlerId 处理器 ID
	 */
	unregisterHandler(handlerId: string): void {
		const handler = this.handlers.get(handlerId);
		if (handler) {
			handler.cleanup();
			this.handlers.delete(handlerId);
		}
	}

	/**
	 * 获取指定的图标处理器
	 * @param handlerId 处理器 ID
	 */
	getHandler<T>(handlerId: string): IIconHandler<T> | undefined {
		return this.handlers.get(handlerId);
	}

	/**
	 * 获取所有已注册的处理器
	 */
	getAllHandlers(): IIconHandler<unknown>[] {
		return Array.from(this.handlers.values());
	}

	/**
	 * 更新所有处理器的设置并重新应用
	 * @param settings 插件设置对象
	 */
	updateSettings(settings: Record<string, unknown> | object): void {
		this.settings = settings as Record<string, unknown>;
		this.handlers.forEach((handler) => {
			// 从设置中提取该处理器对应的配置
			const handlerSettings = this.settings[handler.id];
			// 每个 handler 会根据自己的泛型类型 T 来处理 settings
			handler.initialize(this.app, handlerSettings);
		});
	}

	/**
	 * 应用所有已启用的图标处理器
	 * 对未启用的处理器执行清理
	 */
	applyAll(): void {
		this.handlers.forEach((handler) => {
			if (handler.isEnabled()) {
				try {
					handler.apply();
				} catch (error) {
					console.error(
						`Error applying icon handler "${handler.id}":`,
						error,
					);
				}
			} else {
				// 如果处理器未启用，执行清理操作
				try {
					handler.cleanup();
				} catch (error) {
					console.error(
						`Error cleaning up disabled icon handler "${handler.id}":`,
						error,
					);
				}
			}
		});
	}

	/**
	 * 应用指定的图标处理器
	 * @param handlerId 处理器 ID
	 */
	applyHandler(handlerId: string): void {
		const handler = this.handlers.get(handlerId);
		if (handler && handler.isEnabled()) {
			try {
				handler.apply();
			} catch (error) {
				console.error(
					`Error applying icon handler "${handlerId}":`,
					error,
				);
			}
		}
	}

	/**
	 * 清理所有处理器
	 */
	cleanupAll(): void {
		this.handlers.forEach((handler) => {
			try {
				handler.cleanup();
			} catch (error) {
				console.error(
					`Error cleaning up icon handler "${handler.id}":`,
					error,
				);
			}
		});
		this.handlers.clear();
	}
}
