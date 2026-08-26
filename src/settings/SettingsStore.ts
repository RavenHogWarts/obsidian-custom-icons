import CIPlugin from "@src/main";
import {
	DEFAULT_SETTINGS,
	IBookmarkIconOverride,
	ICommunityPluginIconOverride,
	IFileExplorerIconOverride,
	IPluginSettings,
	IRibbonIconOverride,
	ITabHeaderIconOverride,
} from "@src/types/types";
import {
	normalizeCommunityPluginOverride,
	normalizeIconColor,
} from "@src/util/communityPluginIcon";
import { isBookmarkKind } from "@src/util/bookmarkIcon";
import {
	isValidExtensionKey,
	normalizeExtensionKey,
} from "@src/util/fileExplorerIcon";
import { normalizeGroupName } from "@src/util/groupName";
import { parseTabKey } from "@src/util/tabHeaderIcon";

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
			/**
			 * `true` 仅用于 extensions：保留并收敛 `group`。
			 * folders / files 手写的 `group` 在此被**剥掉**——那两张表没有分组概念，
			 * 留着只会让日后读代码的人以为它有意义（见 types.ts 的字段注释）。
			 */
			keepGroup = false,
			/** extensions 专用：拒掉 `photos/`、`*.png` 这类永不命中的死键 */
			keyIsValid?: (key: string) => boolean,
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
				// 手改过的 data.json 不该把死规则带进界面：它会占一行、永不命中，
				// 而用户无从判断为什么。设置页的输入校验是同一套判定（isValidExtensionKey）
				if (keyIsValid && !keyIsValid(key)) {
					return;
				}
				// folders/files：无图标即无意义（右键分配必带图标），丢弃；
				// extensions：允许空行持久化——设置页「先添加行、再配置图标」的交互，
				// 渲染层 resolveFileIcon 对空 icon 天然跳过，无副作用
				if (dropEmpty && (!override?.icon || !override.type)) {
					return;
				}
				const normalized: IFileExplorerIconOverride = {
					id: key,
					icon: override?.icon ?? "",
					type: override?.type ?? "lucide",
					color: normalizeIconColor(override?.color) ?? "",
				};
				if (keepGroup) {
					// 未分组不留空字段（与 ICustomSVGIcon.group 的写法一致，
					// 不往 data.json 里塞 ""）；脏值 / 非字符串归一为未分组
					const group = normalizeGroupName(override?.group);
					if (group) {
						normalized.group = group;
					}
				}
				result[key] = normalized;
			});
			return result;
		};

		fe.folders = normalizeMap(fe.folders, (k) => k, true);
		fe.files = normalizeMap(fe.files, (k) => k, true);
		fe.extensions = normalizeMap(
			fe.extensions,
			normalizeExtensionKey,
			false,
			true,
			isValidExtensionKey,
		);

		return normalizedSettings;
	}

	#normalizeTabHeaderSettings(settings: IPluginSettings): IPluginSettings {
		const normalizedSettings = JSON.parse(
			JSON.stringify(settings),
		) as IPluginSettings;
		const normalizedData: Record<string, ITabHeaderIconOverride> = {};

		Object.entries(normalizedSettings.tabHeader?.data ?? {}).forEach(
			([rawType, override]) => {
				// data-type 本就是小写连字符机器标识，仅 trim，不做大小写变换
				const dataType = rawType.trim();
				// 防原型污染 + 丢弃无意义条目（无图标则不覆盖）
				if (
					!dataType ||
					dataType === "__proto__" ||
					dataType === "constructor" ||
					dataType === "prototype" ||
					!override?.icon ||
					!override.type
				) {
					return;
				}
				normalizedData[dataType] = {
					id: dataType,
					icon: override.icon,
					type: override.type,
					color: normalizeIconColor(override.color) ?? "",
				};
			},
		);

		// 单标签层：key 必须是合法 `${data-type}::${aria-label}` 复合键
		//（parseTabKey 校验含分隔符且两段非空），其余防护与类型层一致
		const normalizedTabs: Record<string, ITabHeaderIconOverride> = {};
		Object.entries(normalizedSettings.tabHeader?.tabs ?? {}).forEach(
			([rawKey, override]) => {
				const key = rawKey.trim();
				if (
					!key ||
					key === "__proto__" ||
					key === "constructor" ||
					key === "prototype" ||
					!parseTabKey(key) ||
					!override?.icon ||
					!override.type
				) {
					return;
				}
				normalizedTabs[key] = {
					id: key,
					icon: override.icon,
					type: override.type,
					color: normalizeIconColor(override.color) ?? "",
				};
			},
		);

		normalizedSettings.tabHeader.data = normalizedData;
		normalizedSettings.tabHeader.tabs = normalizedTabs;
		return normalizedSettings;
	}

	#normalizeSettings(settings: IPluginSettings): IPluginSettings {
		return this.#normalizeBookmarksSettings(
			this.#normalizeTabHeaderSettings(
				this.#normalizeFileExplorerSettings(
					this.#normalizeRibbonSettings(
						this.#normalizeCommunityPluginSettings(settings),
					),
				),
			),
		);
	}

	#normalizeBookmarksSettings(settings: IPluginSettings): IPluginSettings {
		const normalizedSettings = JSON.parse(
			JSON.stringify(settings),
		) as IPluginSettings;

		const normalizeMap = (
			source: Record<string, IBookmarkIconOverride>,
			keyIsValid: (key: string) => boolean,
		): Record<string, IBookmarkIconOverride> => {
			const result: Record<string, IBookmarkIconOverride> = {};
			Object.entries(source ?? {}).forEach(([rawKey, override]) => {
				const key = rawKey.trim();
				// 防原型污染 + 键合法性 + 丢弃无意义条目（无图标则不覆盖）
				if (
					!key ||
					key === "__proto__" ||
					key === "constructor" ||
					key === "prototype" ||
					!keyIsValid(key) ||
					!override?.icon ||
					!override.type
				) {
					return;
				}
				result[key] = {
					id: key,
					icon: override.icon,
					type: override.type,
					color: normalizeIconColor(override.color) ?? "",
				};
			});
			return result;
		};

		// 单项键 = String(ctime)（数字串，仅需非空且过原型污染）；类型键须为合法 BookmarkKind
		normalizedSettings.bookmarks.items = normalizeMap(
			normalizedSettings.bookmarks?.items,
			() => true,
		);
		normalizedSettings.bookmarks.types = normalizeMap(
			normalizedSettings.bookmarks?.types,
			isBookmarkKind,
		);
		return normalizedSettings;
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
