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

class IconSelector extends FuzzySuggestModal<string> {
	private callback: (icon: string, type: IconType) => void;
	private iconItems: Record<IconType, string[]>;
	private currentType: IconType;
	private previewColor?: string;
	/**
	 * 弹窗应挂载到的窗口文档。
	 * 优先取触发元素所在文档（跨窗口场景下 activeDocument 全局不可靠：
	 * 设置界面打开时从 popout 触发，弹窗会错误地叠到主窗口的设置界面上）。
	 */
	private targetDoc: Document;

	constructor(
		app: App,
		iconItems: Record<IconType, string[]>,
		initialType: IconType,
		previewColor: string | undefined,
		callback: (icon: string, type: IconType) => void,
		sourceEl?: HTMLElement,
	) {
		super(app);
		this.iconItems = iconItems;
		this.currentType = initialType;
		this.previewColor = previewColor;
		this.callback = callback;
		const active = activeDocument as Document | undefined;
		this.targetDoc =
			sourceEl?.ownerDocument ??
			(active?.body
				? active
				: app.workspace.containerEl.ownerDocument);
		this.setInstructions([
			{ command: "↑↓", purpose: "Navigate" },
			{ command: "↵", purpose: "Select" },
			{ command: "esc", purpose: "Dismiss" },
		]);
	}

	onOpen(): void {
		super.onOpen();
		// 防御性挂载：核心若把弹窗挂到了其他文档，移回触发窗口
		if (this.containerEl.ownerDocument !== this.targetDoc) {
			this.targetDoc.body.appendChild(this.containerEl);
		}
		this.addTypeSwitcher();
	}

	private addTypeSwitcher() {
		const container = this.modalEl.createDiv({
			cls: "ci-icon-picker__switcher",
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
		el.addClass("ci-icon-picker__suggestion");

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
