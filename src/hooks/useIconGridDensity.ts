import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { IconGridDensity } from "@src/util/iconGridDensity";
import { useCallback } from "react";

/**
 * 图标库网格密度偏好的读写（落在 `customIconLib.ui.density`）。
 * 四个页面共用一档，切换后重开视图仍保持。
 */
export function useIconGridDensity(): [
	IconGridDensity,
	(next: IconGridDensity) => void,
] {
	const store = useSettingsStore();
	const settings = usePluginSettings(store);

	const setDensity = useCallback(
		(next: IconGridDensity) => {
			void store
				.updateSettingByPath("customIconLib.ui.density", next)
				.catch((error: unknown) => {
					console.error("Failed to save grid density:", error);
				});
		},
		[store],
	);

	return [settings.customIconLib.ui.density, setDensity];
}
