import CIPlugin from "@src/main";
import {
	DEFAULT_SETTINGS,
	ICommunityPluginIconOverride,
	IFileExplorerIconOverride,
	IPluginSettings,
	IRibbonIconOverride,
} from "@src/types/types";
import {
	normalizeCommunityPluginOverride,
	normalizeIconColor,
} from "@src/util/communityPluginIcon";
import { normalizeExtensionKey } from "@src/util/fileExplorerIcon";

export default class SettingsStore {
	#plugin: CIPlugin;
	#subscribers = new Set<() => void>();

	#store = {
		subscribe: (callback: () => void) => {
			this.#subscribers.add(callback);
			return () => this.#subscribers.delete(callback);
		},
		getSnapshot: (): IPluginSettings => this.#plugin.settings,
	};

	constructor(plugin: CIPlugin) {
		this.#plugin = plugin;
	}

	get settings() {
		return this.#plugin.settings;
	}

	get store() {
		return Object.assign({}, this.#store);
	}

	get plugin() {
		return this.#plugin;
	}

	get app() {
		return this.#plugin.app;
	}

	#notifyStoreSubscribers() {
		this.#subscribers.forEach((callback) => callback());
	}

	#mergeWithDefaults<T>(saved: unknown, defaults: T): T {
		if (
			defaults !== null &&
			typeof defaults === "object" &&
			!Array.isArray(defaults)
		) {
			const result: Record<string, unknown> = {};
			const defaultRecord = defaults as unknown as Record<
				string,
				unknown
			>;
			const savedRecord = (saved ?? {}) as Record<string, unknown>;

			// 遍历默认配置的键
			for (const key of Object.keys(defaultRecord)) {
				// 防止原型污染：跳过危险属性
				if (
					key === "__proto__" ||
					key === "constructor" ||
					key === "prototype"
				) {
					continue;
				}

				const defaultValue = defaultRecord[key];
				const savedValue = savedRecord[key];

				// 如果默认值是空对象，且 saved 中有该字段且是对象，直接使用 saved 的值
				if (
					typeof defaultValue === "object" &&
					defaultValue !== null &&
					!Array.isArray(defaultValue) &&
					Object.keys(defaultValue).length === 0 &&
					typeof savedValue === "object" &&
					savedValue !== null
				) {
					result[key] = savedValue;
				} else {
					result[key] = this.#mergeWithDefaults(
						savedValue,
						defaultValue,
					);
				}
			}

			return result as unknown as T;
		}

		const isArrayDefault = Array.isArray(defaults);
		const isArraySaved = Array.isArray(saved);
		if (
			saved === undefined ||
			(typeof defaults !== typeof saved && !isArrayDefault) ||
			(isArrayDefault && !isArraySaved)
		) {
			return defaults;
		}
		return saved as T;
	}

	#normalizeCommunityPluginSettings(
		settings: IPluginSettings,
	): IPluginSettings {
		const normalizedSettings = JSON.parse(
			JSON.stringify(settings),
		) as IPluginSettings;
		const defaultIcon = normalizedSettings.communityPlugins.default;
		defaultIcon.color = normalizeIconColor(defaultIcon.color) ?? "";

		const normalizedData: Record<string, ICommunityPluginIconOverride> =
			{};

		Object.entries(normalizedSettings.communityPlugins.data).forEach(
			([pluginId, pluginIcon]) => {
				const normalizedIcon = normalizeCommunityPluginOverride(
					pluginId,
					defaultIcon,
					pluginIcon,
				);

				if (normalizedIcon) {
					normalizedData[pluginId] = normalizedIcon;
				}
			},
		);

		normalizedSettings.communityPlugins.data = normalizedData;
		return normalizedSettings;
	}

	#normalizeRibbonSettings(settings: IPluginSettings): IPluginSettings {
		const normalizedSettings = JSON.parse(
			JSON.stringify(settings),
		) as IPluginSettings;
		const normalizedData: Record<string, IRibbonIconOverride> = {};

		Object.entries(normalizedSettings.ribbon?.data ?? {}).forEach(
			([label, override]) => {
				// 防原型污染 + 丢弃无意义条目（无图标则不覆盖）
				if (
					!label ||
					label === "__proto__" ||
					label === "constructor" ||
					label === "prototype" ||
					!override?.icon ||
					!override.type
				) {
					return;
				}
				normalizedData[label] = {
					id: label,
					icon: override.icon,
					type: override.type,
					color: normalizeIconColor(override.color) ?? "",
				};
			},
		);

		normalizedSettings.ribbon.data = normalizedData;
		return normalizedSettings;
	}

	#normalizeFileExplorerSettings(
		settings: IPluginSettings,
	): IPluginSettings {
		const normalizedSettings = JSON.parse(
			JSON.stringify(settings),
		) as IPluginSettings;
		const fe = normalizedSettings.fileExplorer;

		// 默认图标颜色归一
		fe.folderDefault.color =
			normalizeIconColor(fe.folderDefault.color) ?? "";
		fe.fileDefault.color = normalizeIconColor(fe.fileDefault.color) ?? "";

		const normalizeMap = (
			source: Record<string, IFileExplorerIconOverride>,
			keyTransform: (key: string) => string,
			dropEmpty: boolean,
		): Record<string, IFileExplorerIconOverride> => {
			const result: Record<string, IFileExplorerIconOverride> = {};
			Object.entries(source ?? {}).forEach(([rawKey, override]) => {
				const key = keyTransform(rawKey);
				// 防原型污染 + 丢弃非法键
				if (
					!key ||
					key === "__proto__" ||
					key === "constructor" ||
					key === "prototype"
				) {
					return;
				}
				// folders/files：无图标即无意义（右键分配必带图标），丢弃；
				// extensions：允许空行持久化——设置页「先添加行、再配置图标」的交互，
				// 渲染层 resolveFileIcon 对空 icon 天然跳过，无副作用
				if (dropEmpty && (!override?.icon || !override.type)) {
					return;
				}
				result[key] = {
					id: key,
					icon: override?.icon ?? "",
					type: override?.type ?? "lucide",
					color: normalizeIconColor(override?.color) ?? "",
				};
			});
			return result;
		};

		fe.folders = normalizeMap(fe.folders, (k) => k, true);
		fe.files = normalizeMap(fe.files, (k) => k, true);
		fe.extensions = normalizeMap(fe.extensions, normalizeExtensionKey, false);

		return normalizedSettings;
	}

	#normalizeSettings(settings: IPluginSettings): IPluginSettings {
		return this.#normalizeFileExplorerSettings(
			this.#normalizeRibbonSettings(
				this.#normalizeCommunityPluginSettings(settings),
			),
		);
	}

	async loadSettings() {
		const saved: unknown = await this.#plugin.loadData();
		// 与默认配置深度对齐：只保留定义内字段并填充缺省
		this.#plugin.settings = this.#normalizeSettings(
			this.#mergeWithDefaults(saved ?? {}, DEFAULT_SETTINGS),
		);
		await this.#plugin.saveSettings();
		this.#notifyStoreSubscribers();
	}

	async updateSettings(settings: IPluginSettings) {
		this.#plugin.settings = this.#normalizeSettings(
			Object.assign({}, settings),
		);
		await this.#plugin.saveSettings();
		this.#notifyStoreSubscribers();
	}

	/**
	 * 通过路径更新特定设置值
	 * @param path 设置路径
	 * @param value 新的设置值
	 */
	async updateSettingByPath<T>(path: string, value: T) {
		// 创建设置的深拷贝
		const newSettings = JSON.parse(
			JSON.stringify(this.#plugin.settings),
		) as IPluginSettings;
		const pathParts = path.split(".");

		// 防止原型污染：验证路径中不包含危险属性
		for (const part of pathParts) {
			if (
				part === "__proto__" ||
				part === "constructor" ||
				part === "prototype"
			) {
				throw new Error(
					`Invalid setting path: ${path} - contains dangerous property`,
				);
			}
		}

		let current: unknown = newSettings;

		// 遍历路径，找到父对象，如果不存在则创建
		for (let i = 0; i < pathParts.length - 1; i++) {
			const part = pathParts[i];
			if (typeof current === "object" && current !== null) {
				const currentRecord = current as Record<string, unknown>;
				// 如果路径不存在，创建一个空对象
				if (
					!Object.prototype.hasOwnProperty.call(currentRecord, part)
				) {
					currentRecord[part] = {};
				}
				current = currentRecord[part];
			} else {
				throw new Error(`Invalid setting path: ${path}`);
			}
		}

		// 设置最终值
		const finalPart = pathParts[pathParts.length - 1];
		if (typeof current === "object" && current !== null) {
			(current as Record<string, unknown>)[finalPart] = value;
		} else {
			throw new Error(`Invalid setting path: ${path}`);
		}

		// 使用 updateSettings 方法更新设置
		await this.updateSettings(newSettings);
	}

	/**
	 * 通过路径删除特定设置值
	 * @param path 设置路径
	 */
	async deleteSettingByPath(path: string) {
		// 创建设置的深拷贝
		const newSettings = JSON.parse(
			JSON.stringify(this.#plugin.settings),
		) as IPluginSettings;
		const pathParts = path.split(".");

		// 防止原型污染：验证路径中不包含危险属性
		for (const part of pathParts) {
			if (
				part === "__proto__" ||
				part === "constructor" ||
				part === "prototype"
			) {
				throw new Error(
					`Invalid setting path: ${path} - contains dangerous property`,
				);
			}
		}

		let current: unknown = newSettings;

		// 遍历路径，找到父对象
		for (let i = 0; i < pathParts.length - 1; i++) {
			const part = pathParts[i];
			if (
				typeof current === "object" &&
				current !== null &&
				Object.prototype.hasOwnProperty.call(current, part)
			) {
				current = (current as Record<string, unknown>)[part];
			} else {
				// 路径不存在，无需删除，直接返回
				return;
			}
		}

		// 删除最终属性
		const finalPart = pathParts[pathParts.length - 1];
		if (
			typeof current === "object" &&
			current !== null &&
			Object.prototype.hasOwnProperty.call(current, finalPart)
		) {
			delete (current as Record<string, unknown>)[finalPart];
			// 使用 updateSettings 方法更新设置
			await this.updateSettings(newSettings);
		}
		// 如果路径不存在，无需删除，直接返回
	}
}
