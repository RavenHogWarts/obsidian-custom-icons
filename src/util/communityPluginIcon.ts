import {
	ICommunityPluginIcon,
	ICommunityPluginIconOverride,
} from "@src/types/types";
import {
	alwaysRenderable,
	type IconRenderable,
} from "@src/util/iconRenderable";

export function normalizeIconColor(color?: string): string | undefined {
	const trimmed = color?.trim();
	return trimmed ? trimmed : undefined;
}

/**
 * 两级解析：单插件覆盖 ?? 默认图标。
 *
 * `canRender` 让画不出来的单插件覆盖（图标包被停用 / 用户 SVG 被删）**回落到默认图标**，
 * 而不是把那一行留成空白——设置一个字都不动，重新启用图标包即刻恢复。
 * 详见 `util/iconRenderable.ts`。
 */
export function resolveCommunityPluginIcon(
	pluginId: string,
	defaultIcon: ICommunityPluginIcon,
	pluginIcon?: ICommunityPluginIconOverride,
	canRender: IconRenderable = alwaysRenderable,
): ICommunityPluginIcon {
	const overrideIcon = pluginIcon?.icon;
	const overrideType = pluginIcon?.type ?? defaultIcon.type;

	/*
	 * 空串是**显式的「这个插件不显示图标」**（`normalizeCommunityPluginOverride`
	 * 会把它存下来），不是失效引用——保持原语义原样透传，不回落到默认图标。
	 * 只有「配了个非空图标、但它现在画不出来」才回落。
	 */
	const useOverride =
		overrideIcon !== undefined &&
		(overrideIcon === "" || canRender(overrideIcon, overrideType));

	return {
		id: pluginId,
		icon: useOverride ? overrideIcon : defaultIcon.icon,
		type: useOverride ? overrideType : defaultIcon.type,
		color:
			normalizeIconColor(pluginIcon?.color) ??
			normalizeIconColor(defaultIcon.color) ??
			"",
	};
}

export function normalizeCommunityPluginOverride(
	pluginId: string,
	defaultIcon: ICommunityPluginIcon,
	pluginIcon: ICommunityPluginIconOverride,
): ICommunityPluginIconOverride | null {
	const normalizedOverride: ICommunityPluginIconOverride = {
		id: pluginIcon.id || pluginId,
	};
	const normalizedDefaultColor = normalizeIconColor(defaultIcon.color);
	const normalizedColor = normalizeIconColor(pluginIcon.color);
	const hasIconOverride =
		pluginIcon.icon !== undefined || pluginIcon.type !== undefined;
	const matchesDefaultIcon =
		(pluginIcon.icon ?? defaultIcon.icon) === defaultIcon.icon &&
		(pluginIcon.type ?? defaultIcon.type) === defaultIcon.type;

	if (hasIconOverride && !matchesDefaultIcon) {
		normalizedOverride.icon = pluginIcon.icon ?? defaultIcon.icon;
		normalizedOverride.type = pluginIcon.type ?? defaultIcon.type;
	}

	if (normalizedColor && normalizedColor !== normalizedDefaultColor) {
		normalizedOverride.color = normalizedColor;
	}

	if (
		normalizedOverride.icon ||
		normalizedOverride.type ||
		normalizedOverride.color
	) {
		return normalizedOverride;
	}

	return null;
}
