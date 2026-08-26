import { useSettingSlot } from "@src/hooks/useSettingContext";
import {
	ButtonComponent,
	ColorComponent,
	DropdownComponent,
	ExtraButtonComponent,
	MomentFormatComponent,
	ProgressBarComponent,
	SearchComponent,
	SliderComponent,
	TextAreaComponent,
	TextComponent,
	ToggleComponent,
	TooltipOptions,
	setTooltip,
} from "obsidian";
import { FC, ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * 把随渲染变化的回调包成一个**恒定引用**的回调。
 *
 * 为什么必须有这个：Obsidian 的按钮组件（`ButtonComponent` /
 * `ExtraButtonComponent`）的 `onClick` 是 `addEventListener`，**注册新的不会清理
 * 旧的**。而调用方几乎都传内联箭头，每次渲染都是新引用，于是
 * `useEffect(..., [component, onClick])` 每渲染一次就多挂一个监听器。
 *
 * 设置页用的是全量快照的 `useSyncExternalStore`（见 `usePluginSettings`），
 * **在筛选框里打一个字就重渲整页**——屏幕上每一枚按钮都随击键增长。幂等按钮
 * （删除、重置）看不出来；不幂等的（骰子、批量清空）会成倍执行，而每次写入又
 * 触发重渲、再叠一层，越点越糟。
 *
 * 包一层之后 deps 恒定，只注册一次；值组件（`onChange` 是赋值而非 addEventListener）
 * 一并用它，省掉每渲染一次的重复注册。
 */
function useStableCallback<A extends unknown[], R>(
	fn: ((...args: A) => R) | undefined,
): (...args: A) => R | undefined {
	const latest = useRef(fn);
	latest.current = fn;
	return useCallback((...args: A) => latest.current?.(...args), []);
}

// ============================================================================
// Button Component
// ============================================================================

export interface ButtonProps {
	children?: ReactNode;
	icon?: string;
	className?: string;
	disabled?: boolean;
	cta?: boolean;
	warning?: boolean;
	tooltip?: string | { text: string; options?: TooltipOptions };
	onClick?: (evt: MouseEvent) => void;
}

export const Button: FC<ButtonProps> = ({
	children,
	icon,
	className,
	disabled,
	cta,
	warning,
	tooltip,
	onClick,
}) => {
	const { slotEl } = useSettingSlot();

	const button = useMemo(() => new ButtonComponent(slotEl), [slotEl]);

	useEffect(() => {
		return () => button.buttonEl.remove();
	}, [button]);

	// 只注册一次：`onClick` 是 addEventListener，重复注册会累积（见 useStableCallback）
	const handleClick = useStableCallback(onClick);
	useEffect(() => {
		button.onClick(handleClick);
	}, [button, handleClick]);

	// 合并其他属性设置（这些属性变化时一起更新）
	useEffect(() => {
		if (icon) button.setIcon(icon);
		if (typeof children === "string") button.setButtonText(children);
		if (className) button.setClass(className);
		if (disabled !== undefined) button.setDisabled(disabled);
		// cta / warning 是加类，从真变假时必须自己摘掉——组件本身只提供加法
		button.buttonEl.toggleClass("mod-cta", Boolean(cta));
		button.buttonEl.toggleClass("mod-warning", Boolean(warning));
		if (tooltip) {
			if (typeof tooltip === "string") {
				button.setTooltip(tooltip);
			} else {
				button.setTooltip(tooltip.text, tooltip.options);
			}
		}
	}, [button, icon, children, className, disabled, cta, warning, tooltip]);

	return <>{createPortal(children, button.buttonEl)}</>;
};

// ============================================================================
// ExtraButton Component
// ============================================================================

export interface ExtraButtonProps {
	children?: ReactNode;
	icon: string;
	disabled?: boolean;
	tooltip?: string | { text: string; options?: TooltipOptions };
	onClick?: () => void | Promise<void>;
}

export const ExtraButton: FC<ExtraButtonProps> = ({
	children,
	icon,
	disabled,
	tooltip,
	onClick,
}) => {
	const { slotEl } = useSettingSlot();

	const button = useMemo(() => new ExtraButtonComponent(slotEl), [slotEl]);

	useEffect(() => {
		return () => button.extraSettingsEl.remove();
	}, [button]);

	// 只注册一次：同 Button，`onClick` 会累积
	const handleClick = useStableCallback(onClick);
	useEffect(() => {
		button.onClick(handleClick);
	}, [button, handleClick]);

	// 合并其他属性设置
	useEffect(() => {
		button.setIcon(icon);
		if (disabled !== undefined) button.setDisabled(disabled);
		if (tooltip) {
			if (typeof tooltip === "string") {
				button.setTooltip(tooltip);
			} else {
				button.setTooltip(tooltip.text, tooltip.options);
			}
		}
	}, [button, icon, disabled, tooltip]);

	return <>{createPortal(children, button.extraSettingsEl)}</>;
};

// ============================================================================
// Toggle Component
// ============================================================================

export interface ToggleProps {
	value?: boolean;
	disabled?: boolean;
	tooltip?: string | { text: string; options?: TooltipOptions };
	onChange?: (value: boolean) => void | Promise<void>;
}

export const Toggle: FC<ToggleProps> = ({
	value,
	disabled,
	tooltip,
	onChange,
}) => {
	const { slotEl } = useSettingSlot();

	const toggle = useMemo(() => new ToggleComponent(slotEl), [slotEl]);

	useEffect(() => {
		return () => toggle.toggleEl.remove();
	}, [toggle]);

	// 分离 onChange 事件处理
	const handleChange = useStableCallback(onChange);
	useEffect(() => {
		toggle.onChange(handleChange);
	}, [toggle, handleChange]);

	// 合并其他属性设置
	useEffect(() => {
		if (value !== undefined) toggle.setValue(value);
		if (disabled !== undefined) toggle.setDisabled(disabled);
		if (tooltip) {
			if (typeof tooltip === "string") {
				toggle.setTooltip(tooltip);
			} else {
				toggle.setTooltip(tooltip.text, tooltip.options);
			}
		}
	}, [toggle, value, disabled, tooltip]);

	return null;
};

// ============================================================================
// Text Component
// ============================================================================

export interface TextProps {
	value?: string;
	placeholder?: string;
	readonly?: boolean;
	onChange?: (value: string) => void;
}

export const Text: FC<TextProps> = ({
	value,
	placeholder,
	readonly,
	onChange,
}) => {
	const { slotEl } = useSettingSlot();

	const text = useMemo(() => new TextComponent(slotEl), [slotEl]);

	useEffect(() => {
		return () => text.inputEl.remove();
	}, [text]);

	// 分离 onChange 事件处理
	const handleChange = useStableCallback(onChange);
	useEffect(() => {
		text.onChange(handleChange);
	}, [text, handleChange]);

	// 合并其他属性设置
	useEffect(() => {
		text.setValue(value ?? "");
		if (placeholder) text.setPlaceholder(placeholder);
		text.inputEl.readOnly = !!readonly;
	}, [text, value, placeholder, readonly]);

	return null;
};

// ============================================================================
// TextArea Component
// ============================================================================

export interface TextAreaProps {
	value?: string;
	placeholder?: string;
	disabled?: boolean;
	onChange?: (value: string) => void;
}

export const TextArea: FC<TextAreaProps> = ({
	value,
	placeholder,
	disabled,
	onChange,
}) => {
	const { slotEl } = useSettingSlot();

	const textArea = useMemo(() => new TextAreaComponent(slotEl), [slotEl]);

	useEffect(() => {
		return () => textArea.inputEl.remove();
	}, [textArea]);

	// 分离 onChange 事件处理
	const handleChange = useStableCallback(onChange);
	useEffect(() => {
		textArea.onChange(handleChange);
	}, [textArea, handleChange]);

	// 合并其他属性设置
	useEffect(() => {
		if (value !== undefined) textArea.setValue(value);
		if (placeholder) textArea.setPlaceholder(placeholder);
		if (disabled !== undefined) textArea.setDisabled(disabled);
	}, [textArea, value, placeholder, disabled]);

	return null;
};

// ============================================================================
// Dropdown Component
// ============================================================================

export interface DropdownProps {
	value?: string;
	options?: Record<string, string>;
	disabled?: boolean;
	onChange?: (value: string) => void;
}

export const Dropdown: FC<DropdownProps> = ({
	value,
	options,
	disabled,
	onChange,
}) => {
	const { slotEl } = useSettingSlot();

	// 不在 useMemo 中添加 options，避免 options 引用变化时重建组件
	const dropdown = useMemo(() => {
		return new DropdownComponent(slotEl);
	}, [slotEl]);

	useEffect(() => {
		return () => dropdown.selectEl.remove();
	}, [dropdown]);

	// 分离 onChange 事件处理
	const handleChange = useStableCallback(onChange);
	useEffect(() => {
		dropdown.onChange(handleChange);
	}, [dropdown, handleChange]);

	// 处理 options 更新
	useEffect(() => {
		if (options) {
			// 清空现有选项
			dropdown.selectEl.empty();
			// 添加新选项
			dropdown.addOptions(options);
		}
	}, [dropdown, options]);

	// 合并其他属性设置
	useEffect(() => {
		if (value !== undefined) dropdown.setValue(value);
		dropdown.setDisabled(disabled ?? false);
	}, [dropdown, value, disabled]);

	return null;
};

// ============================================================================
// Slider Component
// ============================================================================

export interface SliderProps {
	value?: number;
	min?: number;
	max?: number;
	step?: number | "any";
	disabled?: boolean;
	instant?: boolean;
	onChange?: (value: number) => void;
}

export const Slider: FC<SliderProps> = ({
	value,
	min = 0,
	max = 100,
	step = 1,
	disabled,
	instant,
	onChange,
}) => {
	const { slotEl } = useSettingSlot();

	const slider = useMemo(() => {
		const s = new SliderComponent(slotEl);
		s.setLimits(min, max, step);
		return s;
	}, [slotEl, min, max, step]);

	useEffect(() => {
		return () => slider.sliderEl.remove();
	}, [slider]);

	// 分离 onChange 事件处理
	const handleChange = useStableCallback(onChange);
	useEffect(() => {
		slider.onChange(handleChange);
	}, [slider, handleChange]);

	// 合并其他属性设置
	useEffect(() => {
		if (value !== undefined) slider.setValue(value);
		if (disabled !== undefined) slider.setDisabled(disabled);
		// 不再调 setDynamicTooltip()：Obsidian 现在恒在滑块旁内联显示数值，
		// 该方法已废弃且无对应开关，所以连 prop 一起去掉（本仓库无调用方）
		if (instant !== undefined) slider.setInstant(instant);
	}, [slider, value, disabled, instant]);

	return null;
};

// ============================================================================
// Color Component
// ============================================================================

export interface ColorProps {
	value?: string;
	disabled?: boolean;
	/**
	 * 悬浮说明。
	 *
	 * 主要用途是解释 `disabled`：一个灰掉的颜色格子只说明「现在不能改」，
	 * 不说明「为什么」。而在几个 tab 里「为什么」是同一件事——那一行还没选图标，
	 * 颜色无处可施（handler 一律要求有 icon 才渲染）。
	 */
	tooltip?: string;
	onChange?: (value: string) => void | Promise<void>;
}

export const Color: FC<ColorProps> = ({
	value,
	disabled,
	tooltip,
	onChange,
}) => {
	const { slotEl } = useSettingSlot();
	const programmaticSetRef = useRef(false);

	const color = useMemo(() => new ColorComponent(slotEl), [slotEl]);

	useEffect(() => {
		return () => color.colorPickerEl?.remove();
	}, [color]);

	// 分离 onChange 事件处理
	const handleChange = useStableCallback(onChange);
	useEffect(() => {
		color.onChange((v) => {
			// setValue 触发的回调不算用户操作，否则每次外部值变化都会写回一遍
			if (!programmaticSetRef.current) {
				void handleChange(v);
			}
		});
	}, [color, handleChange]);

	// 合并其他属性设置
	useEffect(() => {
		if (value !== undefined) {
			programmaticSetRef.current = true;
			color.setValue(value);
			programmaticSetRef.current = false;
		}
		if (disabled !== undefined) color.setDisabled(disabled);
		// ColorComponent 没有 setTooltip，直接挂到它的元素上
		if (color.colorPickerEl) {
			setTooltip(color.colorPickerEl, tooltip ?? "");
		}
	}, [color, value, disabled, tooltip]);

	return null;
};

// ============================================================================
// Search Component
// ============================================================================

export interface SearchProps {
	value?: string;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	onChange?: (value: string) => void;
}

export const Search: FC<SearchProps> = ({
	value,
	placeholder,
	className,
	disabled,
	onChange,
}) => {
	const { slotEl } = useSettingSlot();

	const search = useMemo(() => new SearchComponent(slotEl), [slotEl]);

	useEffect(() => {
		return () => search.containerEl?.remove();
	}, [search]);

	// 分离 onChange 事件处理
	const handleChange = useStableCallback(onChange);
	useEffect(() => {
		search.onChange(handleChange);
	}, [search, handleChange]);

	// 合并其他属性设置
	useEffect(() => {
		if (value !== undefined) search.setValue(value);
		if (placeholder) search.setPlaceholder(placeholder);
		if (disabled !== undefined) search.setDisabled(disabled);
		if (className) search.setClass(className);
	}, [search, value, placeholder, disabled, className]);

	return null;
};

// ============================================================================
// ProgressBar Component
// ============================================================================

export interface ProgressBarProps {
	value?: number;
	visible?: boolean;
}

export const ProgressBar: FC<ProgressBarProps> = ({
	value,
	visible = true,
}) => {
	const { slotEl } = useSettingSlot();

	const progressBar = useMemo(
		() => new ProgressBarComponent(slotEl),
		[slotEl],
	);

	useEffect(() => {
		return () => progressBar.progressBar?.remove();
	}, [progressBar]);

	useEffect(() => {
		if (value !== undefined) progressBar.setValue(value);
		progressBar.setVisibility(visible);
	}, [progressBar, value, visible]);

	return null;
};

// ============================================================================
// MomentFormat Component
// ============================================================================

export interface MomentFormatProps {
	value?: string;
	placeholder?: string;
	defaultFormat?: string;
	sampleEl?: HTMLElement;
	onChange?: (value: string) => void;
}

export const MomentFormat: FC<MomentFormatProps> = ({
	value,
	placeholder,
	defaultFormat,
	sampleEl,
	onChange,
}) => {
	const { slotEl } = useSettingSlot();

	const momentFormat = useMemo(
		() => new MomentFormatComponent(slotEl),
		[slotEl],
	);

	useEffect(() => {
		return () => momentFormat.inputEl.remove();
	}, [momentFormat]);

	// 分离 onChange 事件处理
	const handleChange = useStableCallback(onChange);
	useEffect(() => {
		momentFormat.onChange(handleChange);
	}, [momentFormat, handleChange]);

	// 合并其他属性设置
	useEffect(() => {
		if (value !== undefined) momentFormat.setValue(value);
		if (placeholder) momentFormat.setPlaceholder(placeholder);
		if (defaultFormat) momentFormat.setDefaultFormat(defaultFormat);
		if (sampleEl) momentFormat.setSampleEl(sampleEl);
	}, [momentFormat, value, placeholder, defaultFormat, sampleEl]);

	return null;
};
