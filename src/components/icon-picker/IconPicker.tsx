import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { IconType } from "@src/types/types";
import { getLucideIconNames } from "@src/util/getLucideIcons";
import setIcon from "@src/util/setIcon";
import { App, FuzzyMatch, FuzzySuggestModal } from "obsidian";
import * as React from "react";
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
			svg: settings.customIconLib.svg.map((icon) => icon.id),
		};
	}, [settings.customIconLib.svg]);

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
			className="CI__icon-picker"
			ref={buttonRef}
			onClick={handleClick}
		></div>
	);
};

class IconSelector extends FuzzySuggestModal<string> {
	private callback: (icon: string, type: IconType) => void;
	private iconItems: Record<IconType, string[]>;
	private currentType: IconType;
	private previewColor?: string;

	constructor(
		app: App,
		iconItems: Record<IconType, string[]>,
		initialType: IconType,
		previewColor: string | undefined,
		callback: (icon: string, type: IconType) => void,
	) {
		super(app);
		this.iconItems = iconItems;
		this.currentType = initialType;
		this.previewColor = previewColor;
		this.callback = callback;
		this.setInstructions([
			{ command: "↑↓", purpose: "Navigate" },
			{ command: "↵", purpose: "Select" },
			{ command: "esc", purpose: "Dismiss" },
		]);
	}

	onOpen(): void {
		super.onOpen();
		this.addTypeSwitcher();
	}

	private addTypeSwitcher() {
		const container = this.modalEl.createDiv({
			cls: "CI__icon-picker-switcher",
		});

		// Insert before the input container (this.inputEl.parentElement)
		// this.inputEl.parentElement is usually .prompt-input-container
		if (
			this.inputEl &&
			this.inputEl.parentElement &&
			this.inputEl.parentElement.parentElement
		) {
			this.inputEl.parentElement.parentElement.insertBefore(
				container,
				this.inputEl.parentElement,
			);
		} else {
			// Fallback if structure is different
			this.modalEl.prepend(container);
		}

		const types = Object.keys(this.iconItems) as IconType[];

		types.forEach((type) => {
			const btn = container.createEl("button", {
				text: type,
				cls: type === this.currentType ? "active" : "",
			});
			btn.addEventListener("click", () => {
				if (this.currentType !== type) {
					this.currentType = type;
					// Update button styles
					container
						.querySelectorAll("button")
						.forEach((b) => b.removeClass("active"));
					btn.addClass("active");

					// Trigger input event to refresh list
					this.inputEl.dispatchEvent(new Event("input"));

					this.inputEl.focus();
				}
			});
		});
	}

	getItems(): string[] {
		return this.iconItems[this.currentType] || [];
	}

	getItemText(icon: string): string {
		return icon;
	}

	renderSuggestion(item: FuzzyMatch<string>, el: HTMLElement) {
		el.addClass("CI__icon-suggestion");

		// 将图标作为子元素追加
		setIcon(el, this.currentType, item.item, {
			append: true,
			color: this.previewColor,
		});

		// 创建文本容器
		el.createSpan({ text: item.item });
	}

	onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
		this.callback(item, this.currentType);
	}
}
