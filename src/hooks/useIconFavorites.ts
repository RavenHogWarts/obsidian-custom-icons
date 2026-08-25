import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import {
	IconRef,
	decodeIconRefs,
	encodeIconRef,
	toggleFavorite,
} from "@src/util/iconRef";
import { useCallback, useMemo } from "react";

/**
 * 收藏图标的读写。
 *
 * 与图标选择器共享 `customIconLib.favorites` 这一份数据（复合键 `${type}:${id}`），
 * 因此在库视图里加的星，下次打开选择器就在「收藏」段里。
 *
 * 写入即落盘（与插件里其它设置项一致），不做延迟提交——避免在库视图里
 * 造出第二套写入路径。
 */
export function useIconFavorites() {
	const store = useSettingsStore();
	const settings = usePluginSettings(store);
	const keys = settings.customIconLib.favorites;

	const refs = useMemo(() => decodeIconRefs(keys), [keys]);
	const keySet = useMemo(() => new Set(keys), [keys]);

	const isFavorite = useCallback(
		(ref: IconRef) => keySet.has(encodeIconRef(ref)),
		[keySet],
	);

	const toggle = useCallback(
		async (ref: IconRef) => {
			try {
				await store.updateSettingByPath(
					"customIconLib.favorites",
					toggleFavorite(
						store.plugin.settings.customIconLib.favorites,
						encodeIconRef(ref),
					),
				);
			} catch (error) {
				console.error("Failed to update favorite icons:", error);
			}
		},
		[store],
	);

	return { refs, isFavorite, toggle };
}
