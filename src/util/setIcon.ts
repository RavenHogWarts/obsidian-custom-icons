import { IconType } from "@src/types/types";
import { setIcon as obsidianSetIcon } from "obsidian";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getLucideIcon } from "./getLucideIcons";

// 存储元素当前的图标信息，用于避免不必要的重新渲染
const iconStateMap = new WeakMap<
	HTMLElement,
	{ type: IconType; icon: string; color?: string }
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

function createDetachedDiv(ownerDocument: Document): HTMLDivElement {
	return ownerDocument.createElement("div");
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

	if (svgView && importedNode instanceof svgView) {
		return importedNode;
	}

	return null;
}

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
): SVGElement | null {
	const svgString = renderToStaticMarkup(
		React.createElement(IconComponent, {
			size: 16,
			strokeWidth: 2,
			color: resolvedColor,
			className,
		}),
	);

	return parseSvgMarkup(ownerDocument, svgString);
}

/**
 * 在指定元素中渲染图标
 * @param el - 目标元素
 * @param iconType - 图标类型
 * @param icon - 图标名称
 * @param options - 配置选项
 * @param options.append - 如果为 true，将图标作为子元素追加；否则替换元素内容
 * @param options.color - 图标颜色，留空时继承默认颜色
 * @returns 渲染图标的容器元素（仅当 append 为 true 时）
 */
export default function (
	el: HTMLElement,
	iconType: IconType,
	icon: string,
	options?: { append?: boolean; color?: string },
): HTMLElement | void {
	const resolvedColor = normalizeColor(options?.color);

	// 检查图标是否已经是目标图标，如果是则跳过渲染（仅对非 append 模式）
	if (!options?.append) {
		const currentState = iconStateMap.get(el);
		if (
			currentState &&
			currentState.type === iconType &&
			currentState.icon === icon &&
			currentState.color === resolvedColor
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
		}
	} else if (iconType === "svg") {
		if (options?.append) {
			const tempContainer = createDetachedDiv(el.ownerDocument);
			obsidianSetIcon(tempContainer, icon);
			if (tempContainer.children.length === 0) {
				obsidianSetIcon(tempContainer, `CI-${icon}`);
			}

			const svgElement = tempContainer.querySelector("svg");
			if (svgElement) {
				if (!svgElement.getAttribute("width")) {
					svgElement.setAttribute("width", "16");
				}
				if (!svgElement.getAttribute("height")) {
					svgElement.setAttribute("height", "16");
				}
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
				});

				if (!svgElement.getAttribute("width")) {
					svgElement.setAttribute("width", "16");
				}
				if (!svgElement.getAttribute("height")) {
					svgElement.setAttribute("height", "16");
				}
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
