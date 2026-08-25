import { ToggleComponent } from "obsidian";
import { useEffect, useRef } from "react";

interface ObsidianToggleProps {
	value: boolean;
	ariaLabel?: string;
	disabled?: boolean;
	onChange: (value: boolean) => void;
}

/**
 * Obsidian 原生开关（`ToggleComponent`）的极薄 React 封装。
 *
 * 不走 Controls.tsx 里那套组件——它们依赖 `SettingSlotContext`，只有设置页里才有；
 * 图标库视图是普通 React 树，直接把 `ToggleComponent` 挂到自己的容器 div 上即可，
 * 拿到与设置页一致的原生开关外观（替换掉裸 `<input type="checkbox">`）。
 *
 * `ToggleComponent.setValue` 不会触发 onChange（仅用户点击触发），故无需像
 * Controls 的 Color 那样加程序化写入保护。
 */
export const ObsidianToggle: React.FC<ObsidianToggleProps> = ({
	value,
	ariaLabel,
	disabled,
	onChange,
}) => {
	const containerRef = useRef<HTMLSpanElement>(null);
	const toggleRef = useRef<ToggleComponent | null>(null);
	// onChange 每次渲染是新引用，经 ref 中转避免重建组件
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	useEffect(() => {
		const el = containerRef.current;
		if (!el) {
			return;
		}
		const toggle = new ToggleComponent(el);
		toggle.onChange((v) => onChangeRef.current(v));
		toggleRef.current = toggle;
		return () => {
			toggle.toggleEl.remove();
			toggleRef.current = null;
		};
	}, []);

	useEffect(() => {
		const toggle = toggleRef.current;
		if (!toggle) {
			return;
		}
		toggle.setValue(value);
		toggle.setDisabled(disabled ?? false);
		if (ariaLabel) {
			toggle.toggleEl.setAttribute("aria-label", ariaLabel);
		}
	}, [value, disabled, ariaLabel]);

	return <span ref={containerRef} className="ci-pack__toggle" />;
};
