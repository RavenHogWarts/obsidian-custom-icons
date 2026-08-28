/**
 * Custom Icons 跨插件 API 契约（v1）—— **供消费方复制的副本**。
 *
 * 提供方：Custom Icons（插件 id `custom-sidebar-icons`）。
 * 权威源码为该仓库的 `src/api/types.ts`，本文件与之逐字同步。
 *
 * ## 怎么用
 *
 * **直接把这个文件复制进你自己的仓库**（例如 `src/types/custom-icons-api.d.ts`）。
 * 不发 npm 包是刻意的：零构建耦合、零版本对齐负担，运行期本来就靠 `version` 守卫。
 *
 * ```ts
 * import { setIcon } from "obsidian";
 * import type { CustomIconsApi } from "./custom-icons-api";
 *
 * const PROVIDER_ID = "custom-sidebar-icons";
 *
 * // 每次用时现取，**不要缓存这个引用**：提供方可能被禁用后重新启用
 * function api(app: App): CustomIconsApi | null {
 *     const p = app.plugins.getPlugin(PROVIDER_ID) as { api?: CustomIconsApi } | null;
 *     return p?.api?.version === 1 ? p.api : null;
 * }
 *
 * // 渲染：先走 API（能画 Lucide 差集），退回公共 setIcon（提供方不在时仍可用）
 * function render(app: App, el: HTMLElement, id: string): boolean {
 *     const provider = api(app);
 *     if (provider) return provider.renderTo(el, id);
 *     setIcon(el, id);
 *     return el.childElementCount > 0;
 * }
 *
 * // 失效传播：**这一条是重点**，没有它你的派生缓存会腐烂
 * this.registerEvent(
 *     this.app.workspace.on("custom-icons:changed", () => this.invalidate()),
 * );
 * ```
 *
 * `app.plugins.getPlugin(id)` 是**非官方 API**；把
 * `@obsidian-typings/obsidian-catalyst-latest` 写进 `tsconfig.types` 可获得类型。
 *
 * ## 三条铁律
 *
 * 1. **契约只用「Obsidian 注册 id 字符串」表达图标**（`lucide-sun` /
 *    `CI-mdi-home` / `CI-我的图标`）。
 * 2. **只增不减、只加不改**。破坏性变更会开 v2 并与 v1 并存一个大版本。
 * 3. 切分点（`CI-mdi-home` 里哪段是 packId）由提供方回答，**消费方不许自己猜**：
 *    packId 与 name 都可含连字符，猜的结果取决于用户装了哪些包。用 `describe()`。
 */


/** 一个图标的来源。 */
export type CustomIconsSource =
	/** Obsidian 原生内置的 Lucide（注册 id `lucide-<name>`） */
	| "builtin"
	/** 用户在图标库里导入的单个 SVG（注册 id `CI-<裸 id>`） */
	| "user-svg"
	/** 某个已启用图标包里的图标（注册 id `CI-<packId>-<name>`） */
	| "pack"
	/** 本插件 bundle 的 lucide-react 比 Obsidian 内置多出来的那批（**不在注册表里**） */
	| "lucide-extra";

/**
 * 这个图标现在能被谁画出来。
 *
 * - `"registry"`：在 `getIconIds()` 里，消费方用公共 `setIcon` 就能画，
 *   **本插件被禁用也不影响**（前提是图标本体还在）；
 * - `"api"`：只有 {@link CustomIconsApi.renderTo} 能画（= Lucide 差集）。
 *   消费方若把这种 id **写进用户文件**，本插件一禁用那个记号就画不出来了。
 */
export type CustomIconsRenderable = "registry" | "api";

/** 单个图标的元信息；不可反推的切分点由本插件负责。 */
export interface CustomIconsIconInfo {
	/** 注册 id（规范化后，与传入的 id 相同） */
	id: string;
	source: CustomIconsSource;
	/**
	 * 相对来源的短名：`lucide-sun` → `sun`；`CI-mdi-home` → `home`；
	 * 用户 SVG → 它的裸 id（`CI-我的图标` → `我的图标`）。
	 */
	name: string;
	/** `source === "pack"` 时给出，其余为 `undefined` */
	packId?: string;
	packName?: string;
	renderable: CustomIconsRenderable;
}

/** 一段候选（与图标选择器的分段一一对应）。 */
export interface CustomIconsGroup {
	/** `"lucide"` | `"svg"` | `` `pack:${packId}` `` */
	id: string;
	/** 已本地化的显示名（跟随 Obsidian 语言） */
	label: string;
	packId?: string;
	/** 该段全部图标的**注册 id**，顺序即选择器里的顺序 */
	ids: string[];
}

/** {@link CustomIconsApi.renderTo} 的选项。 */
export interface CustomIconsRenderOptions {
	/**
	 * 尺寸（px）。**省略 = 不写 width/height，尺寸完全交给 CSS**
	 * ——正文内联要的是 `1em` 跟着字号走，写死像素就固定了。
	 */
	size?: number;
	/** 省略 = 继承 `currentColor`。 */
	color?: string;
}

/** {@link CustomIconsApi.openPicker} 的选项。 */
export interface CustomIconsPickerOptions {
	/** 当前图标的注册 id，用于打开时把高亮停在它身上。 */
	value?: string | null;
	/**
	 * 触发弹窗的元素。**popout 场景必传**：弹窗挂到该元素所在窗口。
	 * 不传则退回 `activeDocument`，从弹出窗口触发时会叠错窗口。
	 */
	sourceEl?: HTMLElement;
	/** 当前颜色，用于网格预览。 */
	color?: string;
	/**
	 * 是否在弹窗内提供颜色控件。
	 * 只给「没有独立颜色控件」的入口开——开着会多出一个真相来源。
	 */
	colorEditable?: boolean;
	include?: {
		/**
		 * 是否列出 Lucide 差集（`renderable: "api"` 那一档）。
		 *
		 * **默认 `false`**：消费方多半会把选中的 id 写进用户文件，
		 * 而那一档在本插件被禁用后就画不出来了（方案 §3.2）。
		 */
		lucideExtras?: boolean;
	};
	/**
	 * 用户选定后回调。
	 *
	 * @param result `null` = 用户点了「清除图标」；
	 *   `color` 为 `undefined` 表示未改动（调用方应保留原值），`""` 为显式清除。
	 */
	onPick(result: { id: string; color?: string } | null): void;
}

/** 变更事件的载荷（`app.workspace.on("custom-icons:changed", …)`）。 */
export interface CustomIconsChangedPayload {
	/** 变更后的 {@link CustomIconsApi.revision} */
	revision: number;
}

/**
 * 变更事件名。
 *
 * 这里**故意只给类型不给值**：`.d.ts` 不产出运行时代码，若声明成 `const`
 * 再 import，打包后会解析到 undefined。请在自己代码里写字面量
 * `app.workspace.on("custom-icons:changed", …)`，
 * 并用 `this.registerEvent(...)` 包起来以自动回收监听器。
 */
export type CustomIconsChangedEvent = "custom-icons:changed";

export interface CustomIconsApi {
	/** 契约版本。消费方必须先判 `api.version === 1` 再用。 */
	readonly version: 1;

	/**
	 * 图标集合的修订号，每次**实际发生**注册/注销后自增。
	 *
	 * 消费方可用它给自己的派生缓存打标，免得为一次无关的设置改动重建缓存。
	 * **不要存盘**：进程内单调递增，重启归零，它是「本次会话内变过没有」的标记。
	 */
	readonly revision: number;

	/**
	 * 把图标画进 `el`（替换其内容）。**唯一能画出 Lucide 差集的入口。**
	 *
	 * @returns 是否真的画出了东西。返回 `false` 时**不改动 `el`**，
	 *   调用方应当保留原文——留白比原文难诊断得多。
	 */
	renderTo(
		el: HTMLElement,
		id: string,
		options?: CustomIconsRenderOptions,
	): boolean;

	/** 这个 id 现在画得出来吗（含 `"api"` 那一档）。热路径可调，不构造全量集合。 */
	has(id: string): boolean;

	/** 元信息；画不出来时返回 `null`。 */
	describe(id: string): CustomIconsIconInfo | null;

	/**
	 * 全部候选，按来源分段。**只读内存缓存，不产生 IO / 网络。**
	 *
	 * 按段返回而不是摊平：单次检索规模是一个包而不是全部图标。
	 * 默认不含 Lucide 差集。
	 */
	catalog(options?: { lucideExtras?: boolean }): CustomIconsGroup[];

	/** 打开图标选择器（复用本插件的分组 / 虚拟网格 / 检索 / 收藏与最近）。 */
	openPicker(options: CustomIconsPickerOptions): void;

	/** 打开图标库视图——把用户送去装包 / 加 SVG，而不是自己复刻一套安装流程。 */
	openLibrary(): void;
}
