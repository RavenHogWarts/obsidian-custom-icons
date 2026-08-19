import {
	SettingContext,
	SettingSlotContext,
} from "@src/context/SettingContext";
import { useSettingContainer } from "@src/hooks/useSettingContext";
import { Setting } from "obsidian";
import { FC, ReactNode, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

export interface SettingItemProps {
	/**
	 * Setting name/title
	 */
	name?: ReactNode;

	/**
	 * Setting description
	 */
	desc?: ReactNode;

	/**
	 * Info slot content (appears before name)
	 */
	info?: ReactNode;

	/**
	 * Control elements (buttons, toggles, etc.)
	 */
	control?: ReactNode;

	/**
	 * Additional children rendered in the main setting element
	 */
	children?: ReactNode;

	/**
	 * CSS class names
	 */
	className?: string;

	/**
	 * Whether this is a heading
	 */
	heading?: boolean;

	/**
	 * Whether the setting is disabled
	 */
	disabled?: boolean;

	/**
	 * Whether the setting is visible
	 */
	visible?: boolean;

	/**
	 * Tooltip text or config
	 */
	tooltip?:
		| string
		| {
				text: string;
				options?: {
					placement?: "top" | "bottom" | "left" | "right";
					delay?: number;
				};
		  };

	/**
	 * Manual container element (overrides context)
	 */
	containerEl?: HTMLElement;
}

/**
 * SettingItem - A declarative wrapper for Obsidian's Setting class
 *
 * @example
 * ```tsx
 * <SettingItem
 *   name="My Setting"
 *   desc="This is a description"
 *   control={<Button onClick={() => {}}>Click me</Button>}
 * />
 * ```
 */
export const SettingItem: FC<SettingItemProps> = ({
	name,
	desc,
	info,
	control,
	children,
	className,
	heading = false,
	disabled = false,
	visible = true,
	tooltip,
	containerEl: providedContainer,
}) => {
	const contextContainer = useSettingContainer();
	const containerEl = providedContainer ?? contextContainer;

	if (!containerEl) {
		throw new Error(
			"SettingItem must have a containerEl (either from context or props)",
		);
	}

	// Create Setting instance
	const setting = useMemo(() => {
		const s = new Setting(containerEl);
		if (heading) {
			s.setHeading();
		}
		return s;
	}, [containerEl, heading]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			setting.clear();
			setting.settingEl.remove(); // 确保 DOM 元素被移除
		};
	}, [setting]);

	// Apply basic settings (合并多个相关的设置以减少 DOM 操作)
	useEffect(() => {
		// Set name if provided
		if (name && typeof name === "string") {
			setting.setName(name);
		}

		// Set desc if provided
		if (desc && typeof desc === "string") {
			setting.setDesc(desc);
		}

		// Apply disabled state
		setting.setDisabled(disabled);

		// Apply visibility
		setting.setVisibility(visible);

		// Apply tooltip
		if (tooltip) {
			if (typeof tooltip === "string") {
				setting.setTooltip(tooltip);
			} else {
				setting.setTooltip(tooltip.text, tooltip.options);
			}
		}
	}, [setting, name, desc, disabled, visible, tooltip]);

	// Apply className (需要单独处理，因为需要清理)
	useEffect(() => {
		if (!className) return;

		const classes = className.split(/\s+/).filter(Boolean);
		classes.forEach((cls) => {
			setting.setClass(cls);
		});

		// 清理函数：在 className 变化或组件卸载时移除旧的类
		return () => {
			classes.forEach((cls) => setting.settingEl.classList.remove(cls));
		};
	}, [setting, className]);

	// Create slot contexts
	const slots = useMemo(
		() => ({
			info: { setting, slotEl: setting.infoEl },
			name: { setting, slotEl: setting.nameEl },
			desc: { setting, slotEl: setting.descEl },
			control: { setting, slotEl: setting.controlEl },
			main: { setting, slotEl: setting.settingEl },
		}),
		[setting],
	);

	return (
		<SettingContext.Provider value={setting}>
			{/* Main setting element */}
			<SettingSlotContext.Provider value={slots.main}>
				{children && createPortal(children, slots.main.slotEl)}
			</SettingSlotContext.Provider>

			{/* Info slot */}
			{info && (
				<SettingSlotContext.Provider value={slots.info}>
					{createPortal(info, slots.info.slotEl)}
				</SettingSlotContext.Provider>
			)}

			{/* Name slot */}
			{name && typeof name !== "string" && (
				<SettingSlotContext.Provider value={slots.name}>
					{createPortal(name, slots.name.slotEl)}
				</SettingSlotContext.Provider>
			)}

			{/* Desc slot */}
			{desc && typeof desc !== "string" && (
				<SettingSlotContext.Provider value={slots.desc}>
					{createPortal(desc, slots.desc.slotEl)}
				</SettingSlotContext.Provider>
			)}

			{/* Control slot */}
			{control && (
				<SettingSlotContext.Provider value={slots.control}>
					{createPortal(control, slots.control.slotEl)}
				</SettingSlotContext.Provider>
			)}
		</SettingContext.Provider>
	);
};
