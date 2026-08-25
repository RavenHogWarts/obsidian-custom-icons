import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { ICustomIconLibUI } from "@src/types/types";
import { useCallback, useState } from "react";

/**
 * 图标库视图偏好的读写（落在 `customIconLib.ui.*`）。
 *
 * 值直接来自 settings，写入即落盘——与插件里其它设置项一致，重开视图仍保持。
 * 适合「切一下就想看到效果」的偏好（密度）。
 */
export function useLibUIPref<K extends keyof ICustomIconLibUI>(
	key: K,
): [ICustomIconLibUI[K], (next: ICustomIconLibUI[K]) => void] {
	const store = useSettingsStore();
	const settings = usePluginSettings(store);

	const setValue = useCallback(
		(next: ICustomIconLibUI[K]) => {
			void store
				.updateSettingByPath(`customIconLib.ui.${key}`, next)
				.catch((error: unknown) => {
					console.error(`Failed to save icon lib pref "${key}":`, error);
				});
		},
		[store, key],
	);

	return [settings.customIconLib.ui[key], setValue];
}

/**
 * 同上，但渲染读的是**本地状态**，落盘是顺带的旁路写入。
 *
 * 为什么要这个变体：`saveSettings()` 会连带 `iconManager.applyAll()`
 * （[main.ts](../main.ts) 第 62 行），装了大包时那是上万次图标注册。
 * 密度按钮偶尔点一次，付这个代价没问题；**页签切换与排序轮换是高频动作**，
 * 让它们等一次全量重应用会明显发涩。所以这里先切界面、再异步补写偏好，
 * 下次打开视图从落盘值起步。
 *
 * 代价：同一 vault 的另一个窗口改了偏好，本窗口当前会话不跟随（视图级偏好，
 * 不是内容数据，不值得为它加跨窗口同步）。
 *
 * @param normalize 把落盘值收敛回合法枚举——`data.json` 是用户可编辑的，
 * 且 `mergeWithDefaults` 只比较类型不校验取值，脏字符串会原样进来。
 */
export function useLibUIPrefLocal<K extends keyof ICustomIconLibUI>(
	key: K,
	normalize: (raw: unknown) => ICustomIconLibUI[K],
): [ICustomIconLibUI[K], (next: ICustomIconLibUI[K]) => void] {
	const store = useSettingsStore();
	// 只在挂载时读一次：之后由本地状态说话
	const [value, setLocal] = useState<ICustomIconLibUI[K]>(() =>
		normalize(store.plugin.settings.customIconLib.ui?.[key]),
	);

	const setValue = useCallback(
		(next: ICustomIconLibUI[K]) => {
			setLocal(next);
			void store
				.updateSettingByPath(`customIconLib.ui.${key}`, next)
				.catch((error: unknown) => {
					console.error(`Failed to save icon lib pref "${key}":`, error);
				});
		},
		[store, key],
	);

	return [value, setValue];
}
