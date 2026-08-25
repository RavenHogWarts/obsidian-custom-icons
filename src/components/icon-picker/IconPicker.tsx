import useSettingsStore from "@src/hooks/useSettingsStore";
import { IconType } from "@src/types/types";
import setIcon from "@src/util/setIcon";
import * as React from "react";
import { IconPickerModal } from "./IconPickerModal";
import "./IconPicker.css";

interface IconPickerProps {
	value: string;
	type: IconType;
	color?: string;
	onChange: (value: string, type: IconType) => void | Promise<void>;
}

export const IconPicker: React.FC<IconPickerProps> = ({
	value,
	type,
	color,
	onChange,
}) => {
	const settingsStore = useSettingsStore();

	const [selectedIcon, setSelectedIcon] = React.useState<string>(value);
	const [selectedType, setSelectedType] = React.useState<IconType>(type);
	const buttonRef = React.useRef<HTMLDivElement>(null);

	const handleClick = () => {
		// 候选列表不再在这里构建：过去每个实例都在 useMemo 里把所有启用包的图标
		// 摊平成一个上万条的数组（设置页 N 行 = N 份），改由弹窗按分组自取。
		new IconPickerModal(
			settingsStore.plugin,
			{
				value: selectedIcon,
				type: selectedType,
				color,
				// 设置页每行旁边已有独立的 Color 控件，弹窗内不再重复提供
				onChange: (icon, iconType) => {
					setSelectedIcon(icon);
					setSelectedType(iconType);
					void onChange(icon, iconType);
				},
			},
			// 触发元素：弹窗挂载到选择器按钮所在的窗口（跨窗口防错位）
			{ sourceEl: buttonRef.current ?? undefined },
		).open();
	};

	React.useEffect(() => {
		if (buttonRef.current) {
			setIcon(buttonRef.current, selectedType, selectedIcon, {
				color,
			});
		}
	}, [color, selectedIcon, selectedType]);

	// 监听外部 value 和 type 变化，同步更新内部状态
	React.useEffect(() => {
		setSelectedIcon(value);
	}, [value]);

	React.useEffect(() => {
		setSelectedType(type);
	}, [type]);

	return (
		<div
			className="ci-icon-picker"
			ref={buttonRef}
			onClick={handleClick}
		></div>
	);
};
