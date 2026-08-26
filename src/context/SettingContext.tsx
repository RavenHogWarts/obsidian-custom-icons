import { Setting } from "obsidian";
import { createContext } from "react";

/**
 * Context for the current Setting instance
 */
export const SettingContext = createContext<Setting | undefined>(undefined);

/**
 * Context for the container element where Settings are rendered
 */
export const SettingContainerContext = createContext<HTMLElement | undefined>(
	undefined,
);

/**
 * Context for accessing specific slots of a Setting
 */
export interface SettingSlotContextValue {
	/**
	 * 该槽位所属的 `Setting`。
	 *
	 * 可选：分组标题上的搜索框 / 操作按钮槽位由 `SettingGroup` 直接提供，
	 * 那里根本没有 `Setting` 实例。目前所有控件只用 `slotEl`。
	 */
	setting?: Setting;
	slotEl: HTMLElement;
}

export const SettingSlotContext = createContext<
	SettingSlotContextValue | undefined
>(undefined);
