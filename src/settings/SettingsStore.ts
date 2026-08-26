// `import type`：这里只把 CIPlugin 当类型用。写成值导入会把 main.ts（连带
// obsidian 运行时）拖进模块图，本文件就没法在 jest 的 node 环境里单测了。
import type CIPlugin from "@src/main";
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
		/*
		 * 直接返回同一个对象，不再 `Object.assign({}, ...)` 复制。
		 *
		 * 复制会让 `usePluginSettings` 每次渲染拿到**新的** `subscribe` 函数，
		 * 而 `useSyncExternalStore` 把它当依赖——于是每渲染一次就退订再订阅一次。
		 */
		return this.#store;
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

	/**
	 * 以下五个 `#normalize*` **就地改写传入的对象**，不自己拷贝。
	 *
	 * 之前每个都各做一次 `JSON.parse(JSON.stringify(settings))`，加上
	 * `updateSettingByPath` 自己那一次，**每改一个颜色就是六趟全量深拷贝**。
	 * 现在深拷贝只在 `#normalizeSettings` 做一次，它们拿到的已经是私有草稿。
	 *
	 * 因此它们只应从 `#normalizeSettings` 调用——传进去的对象会被改。
	 */
	#normalizeCommunityPluginSettings(settings: IPluginSettings): void {
		const normalizedSettings = settings;
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
	}

	#normalizeRibbonSettings(settings: IPluginSettings): void {
		const normalizedSettings = settings;
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
	}

	#normalizeFileExplorerSettings(settings: IPluginSettings): void {
		const normalizedSettings = settings;
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
	}

	#normalizeTabHeaderSettings(settings: IPluginSettings): void {
		const normalizedSettings = settings;
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
	}

	/**
	 * 归一化的唯一入口，也是**唯一一次深拷贝**的地方。
	 *
	 * 五个分归一化器就地改写这份草稿。它们各自都会重建自己那几张表，但也有
	 * 就地改字段的地方（如 `fe.folderDefault.color`），所以必须先拿到一份与调用方
	 * 无关的私有对象——否则会改到别人手里还在用的那个。
	 *
	 * 仍用 JSON 往返而不是 `structuredClone`：设置本来就要序列化进 data.json，
	 * 而 JSON 会顺手丢掉 `undefined`，与落盘后的形状一致。换成 structuredClone
	 * 会让 `{ icon: undefined }` 这类脏值活下来，是行为变化。
	 */
	#normalizeSettings(settings: IPluginSettings): IPluginSettings {
		const draft = JSON.parse(JSON.stringify(settings)) as IPluginSettings;
		this.#normalizeCommunityPluginSettings(draft);
		this.#normalizeRibbonSettings(draft);
		this.#normalizeFileExplorerSettings(draft);
		this.#normalizeTabHeaderSettings(draft);
		this.#normalizeBookmarksSettings(draft);
		return draft;
	}

	#normalizeBookmarksSettings(settings: IPluginSettings): void {
		const normalizedSettings = settings;

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
		// `#normalizeSettings` 自己会深拷贝，这里不必再 Object.assign 一层
		this.#plugin.settings = this.#normalizeSettings(settings);
		await this.#plugin.saveSettings();
		this.#notifyStoreSubscribers();
	}

	/**
	 * 按路径浅拷贝出一份可写草稿：只克隆路径经过的那几层，其余分支与原对象共享。
	 *
	 * 用来替代原先的 `JSON.parse(JSON.stringify(整份设置))`。共享未改动的分支是
	 * 安全的——`#normalizeSettings` 随后还会做一次真正的深拷贝，落盘与 React 快照
	 * 拿到的都是那份新对象；这里只是为了能把值写到指定位置而不动到当前状态。
	 */
	#draftAlongPath(pathParts: string[]): {
		draft: IPluginSettings;
		parent: Record<string, unknown>;
	} {
		const draft = { ...this.#plugin.settings };
		let current = draft as unknown as Record<string, unknown>;
		for (let i = 0; i < pathParts.length - 1; i++) {
			const part = pathParts[i];
			const child = current[part];
			if (Array.isArray(child)) {
				current[part] = [...(child as unknown[])];
			} else if (typeof child === "object" && child !== null) {
				current[part] = { ...child };
			} else if (!Object.prototype.hasOwnProperty.call(current, part)) {
				// 路径不存在就补一个空对象（沿用原先的行为）
				current[part] = {};
			} else {
				throw new Error(`Invalid setting path: ${pathParts.join(".")}`);
			}
			current = current[part] as Record<string, unknown>;
		}
		return { draft, parent: current };
	}

	/** 路径里不能出现这些，否则可污染原型 */
	#assertSafePath(path: string, pathParts: string[]) {
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
	}

	/**
	 * 通过路径更新特定设置值
	 * @param path 设置路径
	 * @param value 新的设置值
	 */
	async updateSettingByPath<T>(path: string, value: T) {
		const pathParts = path.split(".");
		this.#assertSafePath(path, pathParts);
		const { draft, parent } = this.#draftAlongPath(pathParts);
		parent[pathParts[pathParts.length - 1]] = value;
		await this.updateSettings(draft);
	}

	/**
	 * 通过路径删除特定设置值
	 * @param path 设置路径
	 */
	async deleteSettingByPath(path: string) {
		const pathParts = path.split(".");
		this.#assertSafePath(path, pathParts);

		/*
		 * 先在**当前**设置上确认这条路径真的存在，再动手做草稿。
		 *
		 * 顺序很重要：`#draftAlongPath` 会给缺失的中间层补空对象，如果先做草稿
		 * 再判断，就会为一条根本不存在的路径白建一份草稿。而 delete 的既有语义是
		 * 「路径不存在就什么都不做、也不落盘」——不落盘这一点尤其要保住，
		 * 每次落盘都是一遍写盘 + 全量 applyAll。
		 */
		let probe: unknown = this.#plugin.settings;
		for (let i = 0; i < pathParts.length - 1; i++) {
			if (
				typeof probe !== "object" ||
				probe === null ||
				!Object.prototype.hasOwnProperty.call(probe, pathParts[i])
			) {
				return;
			}
			probe = (probe as Record<string, unknown>)[pathParts[i]];
		}
		const finalPart = pathParts[pathParts.length - 1];
		if (
			typeof probe !== "object" ||
			probe === null ||
			!Object.prototype.hasOwnProperty.call(probe, finalPart)
		) {
			return;
		}

		const { draft, parent } = this.#draftAlongPath(pathParts);
		delete parent[finalPart];
		await this.updateSettings(draft);
	}
}
