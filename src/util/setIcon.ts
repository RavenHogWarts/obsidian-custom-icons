import { IconType } from "@src/types/types";
import { setIcon as obsidianSetIcon } from "obsidian";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getLucideIcon } from "./getLucideIcons";

/**
 * 存储元素当前的图标信息，用于避免不必要的重新渲染。
 *
 * `size` **必须进键**：`undefined`（尺寸交给 CSS）与 `16`（写死像素）是两种不同的
 * 产物，同一元素在两种模式间切换时若不比对，会被误判「无变化」而跳过重绘。
 * 与下方 `svg` 分支里那条「渲染失败不记录状态」的注释是同一类教训。
 */
const iconStateMap = new WeakMap<
	HTMLElement,
	{ type: IconType; icon: string; color?: string; size?: number }
>();

function normalizeColor(color?: string): string | undefined {
	const trimmed = color?.trim();
	return trimmed ? trimmed : undefined;
}

function applyIconColor(el: HTMLElement | SVGElement, color?: string): void {
	const resolvedColor = normalizeColor(color);
	if (resolvedColor) {
		el.style.color = resolvedColor;
		return;
	}

	el.style.removeProperty("color");
}

/**
 * 写 svg 的 width/height。
 *
 * `size` 为 `undefined` 时**移除**这两个属性而不是跳过：`obsidianSetIcon` 注册的图标
 * 自带 `width`/`height`（用户导入的 SVG 经 `cleanSvg` 剥过，包图标则不一定），
 * 只是「不写」的话它们会留在原处，`1em` 的 CSS 盒子就管不到实际尺寸。
 */
function applySvgSize(el: SVGElement, size?: number): void {
	if (size === undefined) {
		el.removeAttribute("width");
		el.removeAttribute("height");
		return;
	}
	if (!el.getAttribute("width")) {
		el.setAttribute("width", String(size));
	}
	if (!el.getAttribute("height")) {
		el.setAttribute("height", String(size));
	}
}

function parseSvgMarkup(
	ownerDocument: Document,
	svgMarkup: string,
): SVGElement | null {
	const parser = new DOMParser();
	const parsedDocument = parser.parseFromString(svgMarkup, "image/svg+xml");
	const svgElement = parsedDocument.documentElement;
	const svgView = ownerDocument.defaultView?.SVGElement;

	if (
		svgElement.tagName.toLowerCase() !== "svg" ||
		svgElement.namespaceURI !== "http://www.w3.org/2000/svg"
	) {
		return null;
	}

	const importedNode = ownerDocument.importNode(svgElement, true);

	if (svgView && importedNode.instanceOf(svgView)) {
		return importedNode;
	}

	return null;
}

/**
 * @param size 省略 = **不写 width/height**，尺寸交给 CSS。
 *   lucide-react 总会把 `size` 渲染成 width/height（省略则用它自己的默认 24），
 *   所以这一档只能在产出后把两个属性摘掉，不能靠不传 prop 实现。
 */
function createLucideSvg(
	ownerDocument: Document,
	IconComponent: React.ComponentType<{
		size?: number;
		strokeWidth?: number;
		color?: string;
		className?: string;
	}>,
	resolvedColor?: string,
	className = "svg-icon",
	size?: number,
): SVGElement | null {
	const svgString = renderToStaticMarkup(
		React.createElement(IconComponent, {
			size,
			strokeWidth: 2,
			color: resolvedColor,
			className,
		}),
	);

	const svgElement = parseSvgMarkup(ownerDocument, svgString);
	if (svgElement && size === undefined) {
		svgElement.removeAttribute("width");
		svgElement.removeAttribute("height");
	}
	return svgElement;
}

/**
 * 在指定元素中渲染图标
 * @param el - 目标元素
 * @param iconType - 图标类型
 * @param icon - 图标名称
 * @param options - 配置选项
 * @param options.append - 如果为 true，将图标作为子元素追加；否则替换元素内容
 * @param options.color - 图标颜色，留空时继承默认颜色
 * @param options.size - 图标尺寸（px），默认 16；如 Ribbon 按钮原生为 24。
 *   传 `null` = **不写 width/height**，尺寸完全交给 CSS（正文内联要 `1em` 跟着字号走，
 *   写死像素就固定了）。跨插件 API 的 `renderTo` 省略 size 时走的就是这一档。
 * @returns 渲染图标的容器元素（仅当 append 为 true 时）
 */
export default function (
	el: HTMLElement,
	iconType: IconType,
	icon: string,
	options?: { append?: boolean; color?: string; size?: number | null },
): HTMLElement | void {
	const resolvedColor = normalizeColor(options?.color);
	// null = 交给 CSS（不写尺寸属性）；undefined = 保持既有默认 16
	const size = options?.size === null ? undefined : (options?.size ?? 16);

	// 检查图标是否已经是目标图标，如果是则跳过渲染（仅对非 append 模式）
	if (!options?.append) {
		const currentState = iconStateMap.get(el);
		if (
			currentState &&
			currentState.type === iconType &&
			currentState.icon === icon &&
			currentState.color === resolvedColor &&
			currentState.size === size
		) {
			return; // 图标没有变化，跳过渲染
		}
	}

	// 支持 lucide-react (v0.561.0) 图标
	if (iconType === "lucide") {
		const IconComponent = getLucideIcon(icon);

		if (IconComponent) {
			try {
				if (options?.append) {
					const svgElement = createLucideSvg(
						el.ownerDocument,
						IconComponent,
						resolvedColor,
						"lucide-icon",
						size,
					);
					if (svgElement) {
						applyIconColor(svgElement, resolvedColor);
						el.appendChild(svgElement);
						return svgElement as unknown as HTMLElement;
					}
				} else {
					el.empty();
					applyIconColor(el, resolvedColor);

					const svgElement = createLucideSvg(
						el.ownerDocument,
						IconComponent,
						resolvedColor,
						"svg-icon",
						size,
					);
					if (svgElement) {
						applyIconColor(svgElement, resolvedColor);
						el.appendChild(svgElement);

						// 更新图标状态（仅当实际渲染出图标时记录，
						// 避免"渲染失败却被去重跳过"的空白固化）
						iconStateMap.set(el, {
							type: iconType,
							icon,
							color: resolvedColor,
							size,
						});
					}
				}
			} catch (error) {
				console.error(`Error rendering Lucide icon "${icon}":`, error);
				if (!options?.append) {
					iconStateMap.delete(el);
				}
			}
			} else {
				console.warn(`Lucide icon "${icon}" not found`);
				if (!options?.append) {
					// 替换模式下清空旧内容并移除状态，与 svg 分支保持一致的替换语义
					// （否则色块/容器会残留上一次的图标，如重置后的 IconPicker）
					el.empty();
					iconStateMap.delete(el);
				}
			}
	} else if (iconType === "svg") {
		if (options?.append) {
			// 游离容器仅作 obsidianSetIcon 的暂存区，
			// svg 节点 append 到目标元素时会自动跨文档 adopt
			const tempContainer = createDiv();
			obsidianSetIcon(tempContainer, icon);
			if (tempContainer.children.length === 0) {
				obsidianSetIcon(tempContainer, `CI-${icon}`);
			}

			const svgElement = tempContainer.querySelector("svg");
			if (svgElement) {
				applySvgSize(svgElement, size);
				svgElement.classList.add("svg-icon");
				applyIconColor(svgElement, resolvedColor);

				el.appendChild(svgElement);
				return svgElement as unknown as HTMLElement;
			}
		} else {
			el.empty();
			obsidianSetIcon(el, icon);
			if (el.children.length === 0) {
				obsidianSetIcon(el, `CI-${icon}`);
			}

			const svgElement = el.querySelector("svg");
			// 仅当实际渲染出图标时记录状态并应用样式；
			// 渲染失败（如库图标尚未注册）时不记录，让下一轮 apply 重试，
			// 避免"渲染失败却被去重跳过"的空白固化
			if (svgElement) {
				iconStateMap.set(el, {
					type: iconType,
					icon,
					color: resolvedColor,
					size,
				});

				applySvgSize(svgElement, size);
				svgElement.classList.add("svg-icon");
				applyIconColor(svgElement, resolvedColor);
			}
		}
	}
}

export function cleanupIcon(el: HTMLElement) {
	iconStateMap.delete(el);
	el.empty();
}
