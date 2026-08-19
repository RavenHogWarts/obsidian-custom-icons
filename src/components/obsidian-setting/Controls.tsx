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
} from "obsidian";
import { FC, ReactNode, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

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

	// 分离 onClick 事件处理（事件处理器需要独立更新）
	useEffect(() => {
		if (onClick) {
			button.onClick(onClick);
		}
	}, [button, onClick]);

	// 合并其他属性设置（这些属性变化时一起更新）
	useEffect(() => {
		if (icon) button.setIcon(icon);
		if (typeof children === "string") button.setButtonText(children);
		if (className) button.setClass(className);
		if (disabled !== undefined) button.setDisabled(disabled);
		if (cta) button.setCta();
		if (warning) button.setWarning();
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

	// 分离 onClick 事件处理
	useEffect(() => {
		if (onClick) {
			button.onClick(onClick);
		}
	}, [button, onClick]);

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
	useEffect(() => {
		if (onChange) {
			toggle.onChange(onChange);
		}
	}, [toggle, onChange]);

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
	useEffect(() => {
		if (onChange) {
			text.onChange(onChange);
		}
	}, [text, onChange]);

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
	useEffect(() => {
		if (onChange) {
			textArea.onChange(onChange);
		}
	}, [textArea, onChange]);

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
	useEffect(() => {
		if (onChange) {
			dropdown.onChange(onChange);
		}
	}, [dropdown, onChange]);

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
	dynamicTooltip?: boolean;
	instant?: boolean;
	onChange?: (value: number) => void;
}

export const Slider: FC<SliderProps> = ({
	value,
	min = 0,
	max = 100,
	step = 1,
	disabled,
	dynamicTooltip,
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
	useEffect(() => {
		if (onChange) {
			slider.onChange(onChange);
		}
	}, [slider, onChange]);

	// 合并其他属性设置
	useEffect(() => {
		if (value !== undefined) slider.setValue(value);
		if (disabled !== undefined) slider.setDisabled(disabled);
		if (dynamicTooltip) slider.setDynamicTooltip();
		if (instant !== undefined) slider.setInstant(instant);
	}, [slider, value, disabled, dynamicTooltip, instant]);

	return null;
};

// ============================================================================
// Color Component
// ============================================================================

export interface ColorProps {
	value?: string;
	disabled?: boolean;
	onChange?: (value: string) => void | Promise<void>;
}

export const Color: FC<ColorProps> = ({ value, disabled, onChange }) => {
	const { slotEl } = useSettingSlot();
	const programmaticSetRef = useRef(false);

	const color = useMemo(() => new ColorComponent(slotEl), [slotEl]);

	useEffect(() => {
		return () => color.colorPickerEl?.remove();
	}, [color]);

	// 分离 onChange 事件处理
	useEffect(() => {
		if (onChange) {
			color.onChange((v) => {
				if (!programmaticSetRef.current) {
					void onChange(v);
				}
			});
		}
	}, [color, onChange]);

	// 合并其他属性设置
	useEffect(() => {
		if (value !== undefined) {
			programmaticSetRef.current = true;
			color.setValue(value);
			programmaticSetRef.current = false;
		}
		if (disabled !== undefined) color.setDisabled(disabled);
	}, [color, value, disabled]);

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
	useEffect(() => {
		if (onChange) {
			search.onChange(onChange);
		}
	}, [search, onChange]);

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
	useEffect(() => {
		if (onChange) {
			momentFormat.onChange(onChange);
		}
	}, [momentFormat, onChange]);

	// 合并其他属性设置
	useEffect(() => {
		if (value !== undefined) momentFormat.setValue(value);
		if (placeholder) momentFormat.setPlaceholder(placeholder);
		if (defaultFormat) momentFormat.setDefaultFormat(defaultFormat);
		if (sampleEl) momentFormat.setSampleEl(sampleEl);
	}, [momentFormat, value, placeholder, defaultFormat, sampleEl]);

	return null;
};
