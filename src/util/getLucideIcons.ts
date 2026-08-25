import * as icons from "lucide-react";
import { getIconIds } from "obsidian";

/** Lucide 图标组件实际消费的 props（与 setIcon.ts 渲染时一致） */
export type LucideIconProps = {
	size?: number;
	strokeWidth?: number;
	color?: string;
	className?: string;
};

/**
 * 获取所有可用的 Lucide 图标名称列表
 * 从 lucide-react 包中提取所有唯一的图标组件名称
 *
 * lucide-react 导出多种格式：
 * - PascalCase (如 Apple)
 * - PascalCaseIcon (如 AppleIcon)
 * - LucidePascalCase (如 LucideApple)
 *
 * 我们需要去重，只保留唯一的图标
 */
/** 图标名缓存：lucide-react 导出在运行期不变，一次计算全局复用 */
let cachedIconNames: string[] | null = null;

export function getLucideIconNames(): string[] {
	if (cachedIconNames) {
		return cachedIconNames;
	}

	const iconSet = new Set<string>();
	const excludedKeys = new Set([
		"default",
		"createLucideIcon",
		"icons",
		"Icon",
		// React Context Provider（非图标），去掉 Lucide 前缀后会被误提取为 "provider"
		"LucideProvider",
	]);

	for (const key in icons) {
		// 跳过特殊导出
		if (excludedKeys.has(key)) {
			continue;
		}

		const value = icons[key as keyof typeof icons];

		// 图标组件是对象（React 组件），不是简单的函数
		// 跳过 undefined 和 null
		if (
			!value ||
			typeof value === "string" ||
			typeof value === "number" ||
			typeof value === "boolean"
		) {
			continue;
		}

		// 去除后缀和前缀，提取基础名称
		let baseName = key;

		// 先去除 "Lucide" 前缀
		if (baseName.startsWith("Lucide")) {
			baseName = baseName.slice(6);
		}

		// 再去除 "Icon" 后缀
		if (baseName.endsWith("Icon")) {
			baseName = baseName.slice(0, -4);
		}

		// 确保是 PascalCase 格式（以大写字母开头且不为空）
		if (baseName && /^[A-Z]/.test(baseName)) {
			// 将 PascalCase 转换为 kebab-case
			const iconName = baseName
				.replace(/([A-Z])/g, "-$1")
				.toLowerCase()
				.slice(1);

			if (iconName) {
				iconSet.add(iconName);
			}
		}
	}

	return (cachedIconNames = Array.from(iconSet).sort());
}

/** 名称集缓存：`hasLucideIcon` 用，随 getLucideIconNames 一次构建 */
let cachedIconNameSet: Set<string> | null = null;

/**
 * 该 lucide 名是否可渲染。
 *
 * 与 `getLucideIcon` 的区别是**不打日志**：校验 recent / favorites 里的历史键时，
 * 失效项是预期输入而非异常，走 getLucideIcon 会让每次渲染都刷一串 warning。
 */
export function hasLucideIcon(name: string): boolean {
	if (!cachedIconNameSet) {
		cachedIconNameSet = new Set(getLucideIconNames());
	}
	return cachedIconNameSet.has(name);
}

/**
 * 将 PascalCase 组件名称转换为 kebab-case 名称
 * 与 getLucideIconNames 的提取规则一致（如 ArrowDownAZ -> arrow-down-a-z）
 */
export function componentNameToIconName(componentName: string): string {
	return componentName
		.replace(/([A-Z])/g, "-$1")
		.toLowerCase()
		.slice(1);
}

/**
 * 规范化图标名称，用于跨版本比对
 * lucide 新旧命名的差异主要是连字符位置（如 arrow-down-az / arrow-down-a-z、
 * arrow-down01 / arrow-down-0-1），去掉连字符后即可对齐
 */
function normalizeIconName(name: string): string {
	return name.replace(/-/g, "");
}

/** 目录条目：去重后的图标 + 是否为 Obsidian 原生内置 */
export interface LucideCatalogEntry {
	/** 去重主名（kebab-case，取组件 displayName） */
	name: string;
	/** Obsidian 原生是否内置（忽略连字符差异比对） */
	builtin: boolean;
}

let cachedCatalog: LucideCatalogEntry[] | null = null;

/**
 * Lucide 图标目录：按组件归组去重（新旧命名如 arrow-down-az / arrow-down-a-z
 * 指向同一组件，只保留主名），并标注每个图标是否为 Obsidian 原生内置。
 *
 * 供「全部 / 内置 / 差异」三种筛选视图共用同一数据源。
 *
 * 比对时需处理两类差异：
 * 1. Obsidian 注册的内置 Lucide 图标 id 带 "lucide-" 前缀（如 "lucide-arrow-right"）；
 * 2. lucide-react 新旧命名并存（别名组件的 displayName 即主名），
 *    组内任一名称与内置匹配即视为内置。
 */
export function getLucideIconCatalog(): LucideCatalogEntry[] {
	if (cachedCatalog) {
		return cachedCatalog;
	}

	const obsidianIconIds = new Set(
		getIconIds()
			.filter((id) => id.startsWith("lucide-"))
			.map((id) => normalizeIconName(id.slice("lucide-".length))),
	);

	// 按组件 displayName 归组：同一图标的多个新旧名称 -> 一组，代表名取主名
	const namesByComponent = new Map<string, Set<string>>();
	for (const name of getLucideIconNames()) {
		const component = getLucideIcon(name);
		const displayName = component?.displayName;
		if (!displayName) {
			continue;
		}
		const names = namesByComponent.get(displayName) ?? new Set<string>();
		names.add(name);
		namesByComponent.set(displayName, names);
	}

	const entries: LucideCatalogEntry[] = [];
	for (const [displayName, names] of namesByComponent) {
		const builtin = Array.from(names).some((name) =>
			obsidianIconIds.has(normalizeIconName(name)),
		);
		entries.push({
			name: componentNameToIconName(displayName),
			builtin,
		});
	}

	return (cachedCatalog = entries.sort((a, b) =>
		a.name.localeCompare(b.name),
	));
}

/**
 * 获取插件引入的 Lucide 中、Obsidian 原生未内置的图标名称（差异集）
 * @see getLucideIconCatalog
 */
export function getExtraLucideIconNames(): string[] {
	return getLucideIconCatalog()
		.filter((entry) => !entry.builtin)
		.map((entry) => entry.name);
}

/**
 * 将 kebab-case 图标名称转换为 PascalCase 组件名称
 * 例如：arrow-right -> ArrowRight
 */
export function iconNameToComponentName(iconName: string): string {
	const pascalCase = iconName
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");

	return pascalCase;
}

/**
 * 获取 Lucide 图标组件
 * @param iconName - kebab-case 格式的图标名称（例如：'arrow-right'）
 * @returns 图标组件或 undefined
 */
export function getLucideIcon(
	iconName: string,
): React.ComponentType<LucideIconProps> | undefined {
	if (!iconName) {
		console.warn("getLucideIcon: iconName is empty");
		return undefined;
	}

	const componentName = iconNameToComponentName(iconName);

	// 直接获取 PascalCase 格式的图标组件
	const component = icons[componentName as keyof typeof icons] as
		| React.ComponentType<LucideIconProps>
		| undefined;

	if (!component) {
		console.warn(`Lucide icon "${iconName}" (${componentName}) not found`);
	}

	return component;
}
