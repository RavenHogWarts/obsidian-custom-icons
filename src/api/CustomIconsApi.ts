import CIPlugin from "@src/main";
import { IconType } from "@src/types/types";
import { buildPackLookup } from "@src/util/iconExists";
import { hasLucideIcon } from "@src/util/getLucideIcons";
import { IconRef } from "@src/util/iconRef";
import { buildIconSources } from "@src/util/iconSources";
import openPluginView from "@src/util/openPluginView";
import setIcon from "@src/util/setIcon";
import { VIEW_TYPE_CUSTOM_ICON_LIB } from "@src/views/CustomIconLibView";
import { IconPickerModal } from "@src/components/icon-picker/IconPickerModal";
import { getIcon } from "obsidian";
import {
	CI_PREFIX,
	LUCIDE_PREFIX,
	describeIconId,
	type DescribeIconDeps,
} from "./describeIcon";
import {
	CustomIconsApi,
	CustomIconsGroup,
	CustomIconsIconInfo,
	CustomIconsPickerOptions,
	CustomIconsRenderOptions,
} from "./types";

/**
 * 内部 `IconRef` → 契约用的**注册 id**。
 *
 * 两类图标的 `IconRef.id` 语义不同（见 dev/ecosystem/跨插件API导出方案.md §3.1）：
 * 用户 SVG 存**裸 id**（注册时补前缀），包图标存的已经是全 id。这个函数是
 * 那个不一致的唯一出口，别在别处再写一遍。
 */
function toRegistryId(ref: IconRef): string {
	if (ref.type === "lucide") {
		// 差集图标同样给 `lucide-` 形态：它今天不在注册表里，但等 Obsidian 哪天
		// 内置了同名图标，同一个 id 会自动从 "api" 档升到 "registry" 档，
		// 用户文件里已经写下的记号不用改。
		return `${LUCIDE_PREFIX}${ref.id}`;
	}
	return ref.id.startsWith(CI_PREFIX) ? ref.id : `${CI_PREFIX}${ref.id}`;
}

/** 注册表里有没有这个 id。`getIcon` 是 O(1) 查表，不必快照上万条 id。 */
function inRegistry(id: string): boolean {
	return getIcon(id) !== null;
}

/**
 * 反查所需的索引，按 `revision` 缓存。
 *
 * `has()` 会在渲染热路径上被反复调用，每次重建「用户 SVG id 集合」与包前缀表
 * 是无谓开销；而 revision 只在注册表真的动过之后才变，正好是这份索引的失效条件。
 */
interface Lens extends DescribeIconDeps {
	revision: number;
}

export function createCustomIconsApi(plugin: CIPlugin): CustomIconsApi {
	let cached: Lens | null = null;

	const getLens = (): Lens => {
		const revision = plugin.iconRevision;
		if (cached && cached.revision === revision) {
			return cached;
		}
		const lib = plugin.settings.customIconLib;
		const packNames: Record<string, string> = {};
		for (const manifest of Object.values(lib.packs)) {
			packNames[manifest.id] = manifest.name;
		}
		const lens: Lens = {
			revision,
			// 与 CustomIconLibHandler 的注册条件对齐：content 为空的条目不进注册表
			svgIds: new Set(
				lib.svg.filter((icon) => icon.content).map((icon) => icon.id),
			),
			packOf: buildPackLookup({
				lib,
				getPack: (id) => plugin.iconPackStore.getCachedPack(id),
			}),
			packNames,
			inRegistry,
			hasLucide: hasLucideIcon,
		};
		cached = lens;
		return lens;
	};

	/** 判定规则见 `describeIcon.ts`（纯函数，有单测） */
	const describe = (id: string): CustomIconsIconInfo | null =>
		describeIconId(id, getLens());

	/** 契约 id → 内部 `IconRef`，用于喂给 `setIcon` 与图标选择器 */
	const toIconRef = (info: CustomIconsIconInfo): IconRef => {
		// 差集只能走 lucide-react 现场渲染；注册表里有的一律走 obsidianSetIcon
		// （`svg` 分支），省掉一次 renderToStaticMarkup
		if (info.renderable === "api") {
			return { type: "lucide", id: info.name };
		}
		// 用户 SVG 在选择器里的条目是**裸 id**，必须还原成裸的，
		// 否则打开选择器时高亮落不到当前图标上
		const type: IconType = "svg";
		return { type, id: info.source === "user-svg" ? info.name : info.id };
	};

	return {
		version: 1,

		get revision() {
			return plugin.iconRevision;
		},

		has(id: string): boolean {
			return describe(id) !== null;
		},

		describe,

		renderTo(
			el: HTMLElement,
			id: string,
			options?: CustomIconsRenderOptions,
		): boolean {
			const info = describe(id);
			if (!info) {
				return false;
			}
			const ref = toIconRef(info);

			/*
			 * 先画进游离容器再搬进 el：契约承诺「返回 false 时不改动 el」，
			 * 而替换模式会先 `el.empty()` 再尝试——失败就把调用方的原文清掉了。
			 * append 模式天生是「成功才碰目标元素」，正好符合。
			 */
			const holder = createDiv();
			const svg = setIcon(holder, ref.type, ref.id, {
				append: true,
				color: options?.color,
				// null = 不写 width/height，尺寸交给 CSS（契约的默认档）
				size: options?.size ?? null,
			});
			if (!svg) {
				return false;
			}

			// append 模式下 lucide 分支给的类名是 `lucide-icon`，svg 分支是 `svg-icon`；
			// 对外统一成 `svg-icon`，消费方只需要写一条选择器
			svg.classList.add("svg-icon");
			el.empty();
			el.appendChild(svg);
			return true;
		},

		catalog(options?: { lucideExtras?: boolean }): CustomIconsGroup[] {
			return buildIconSources(plugin, {
				// 契约默认不含差集（写进用户文件后会随本插件被禁用而消失）
				lucideExtras: options?.lucideExtras ?? false,
			}).map((source) => ({
				id: source.id,
				label: source.label,
				packId: source.id.startsWith("pack:")
					? source.id.slice("pack:".length)
					: undefined,
				ids: source.entries.map(toRegistryId),
			}));
		},

		openPicker(options: CustomIconsPickerOptions): void {
			const current = options.value ? describe(options.value) : null;
			const ref = current ? toIconRef(current) : null;

			new IconPickerModal(
				plugin,
				{
					value: ref?.id ?? "",
					type: ref?.type ?? "lucide",
					color: options.color,
					colorEditable: options.colorEditable,
					include: {
						lucideExtras: options.include?.lucideExtras ?? false,
					},
					onChange: (icon, type, color) => {
						// 空图标 = 用户点了「清除图标」
						options.onPick(
							icon
								? { id: toRegistryId({ type, id: icon }), color }
								: null,
						);
					},
				},
				{ sourceEl: options.sourceEl },
			).open();
		},

		openLibrary(): void {
			void openPluginView(plugin.app, VIEW_TYPE_CUSTOM_ICON_LIB);
		},
	};
}
