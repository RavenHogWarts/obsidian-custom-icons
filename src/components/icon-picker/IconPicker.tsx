import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { IconType } from "@src/types/types";
import { getLucideIconNames } from "@src/util/getLucideIcons";
import setIcon from "@src/util/setIcon";
import { App } from "obsidian";
import * as React from "react";
import { IconSelector } from "./IconSelector";
import "./IconPicker.css";

interface IconPickerProps {
	app: App;
	value: string;
	type: IconType;
	color?: string;
	onChange: (value: string, type: IconType) => void | Promise<void>;
}

export const IconPicker: React.FC<IconPickerProps> = ({
	app,
	value,
	type,
	color,
	onChange,
}) => {
	const settingsStore = useSettingsStore();
	const settings = usePluginSettings(settingsStore);

	const iconItems = React.useMemo(() => {
		return {
			lucide: getLucideIconNames(),
			svg: [
				// 用户单个导入的 SVG（裸 id，渲染走 CI- 回退）
				...settings.customIconLib.svg.map((icon) => icon.id),
				// 已启用图标库的图标（完整注册 id CI-{packId}-{name}）
				...settingsStore.plugin.iconPackStore.getEnabledIconIds(
					settings.customIconLib.packs,
				),
			],
		};
	}, [
		settings.customIconLib.svg,
		settings.customIconLib.packs,
		settingsStore,
	]);

	const [selectedIcon, setSelectedIcon] = React.useState<string>(value);
	const [selectedType, setSelectedType] = React.useState<IconType>(type);
	const buttonRef = React.useRef<HTMLDivElement>(null);

	const handleClick = () => {
		const modal = new IconSelector(
			app,
			iconItems,
			selectedType,
			color,
			(icon, type) => {
				setSelectedIcon(icon);
				setSelectedType(type);
				void onChange(icon, type);
			},
			// 触发元素：弹窗挂载到选择器按钮所在的窗口（跨窗口防错位）
			buttonRef.current ?? undefined,
		);
		modal.open();
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
