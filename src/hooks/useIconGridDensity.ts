import { useLibUIPref } from "@src/hooks/useLibUIPref";
import { IconGridDensity } from "@src/util/iconGridDensity";

/**
 * 图标库网格密度偏好的读写（落在 `customIconLib.ui.density`）。
 * 四个页面共用一档，切换后重开视图仍保持。
 *
 * 用「读 settings」而非本地状态的变体：同时挂载的页面必须看到同一档，
 * 且切密度是偶发动作，付一次 `applyAll` 的代价可以接受。
 */
export function useIconGridDensity(): [
	IconGridDensity,
	(next: IconGridDensity) => void,
] {
	return useLibUIPref("density");
}
