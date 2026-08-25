import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { buildIconExistence } from "@src/util/iconExists";
import {
	IconRef,
	decodeIconRefs,
	encodeIconRef,
	toggleFavorite,
} from "@src/util/iconRef";
import { hasLucideIcon } from "@src/util/getLucideIcons";
import { useCallback, useMemo } from "react";

/**
 * 收藏图标的读写。
 *
 * 与图标选择器共享 `customIconLib.favorites` 这一份数据（复合键 `${type}:${id}`），
 * 因此在库视图里加的星，下次打开选择器就在「收藏」段里。
 *
 * 写入即落盘（与插件里其它设置项一致），不做延迟提交——避免在库视图里
 * 造出第二套写入路径。
 *
 * `refs` 已滤掉当前渲染不出来的项：图标被删、被改名，或所属包被卸载 / 停用 / 更新后，
 * 键仍留在设置里，直接铺出来就是一格空白。滤的是**读取**而非存储，因此停用的包
 * 重新启用后收藏会自己回来（删除路径另有清理，见 `removeIconKeys`）。
 */
export function useIconFavorites() {
	const store = useSettingsStore();
	const settings = usePluginSettings(store);
	const lib = settings.customIconLib;
	const keys = lib.favorites;

	const exists = useMemo(
		() =>
			buildIconExistence({
				lib,
				getPack: (packId) =>
					store.plugin.iconPackStore.getCachedPack(packId),
				hasLucide: hasLucideIcon,
			}),
		[lib, store.plugin],
	);

	const refs = useMemo(
		() => decodeIconRefs(keys).filter(exists),
		[keys, exists],
	);
	const keySet = useMemo(
		() => new Set(refs.map(encodeIconRef)),
		[refs],
	);

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
