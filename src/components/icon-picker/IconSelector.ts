import { IconType } from "@src/types/types";
import setIcon from "@src/util/setIcon";
import { App, FuzzyMatch, FuzzySuggestModal } from "obsidian";

/**
 * 图标选择器弹窗（基于 Obsidian FuzzySuggestModal）。
 *
 * 从 IconPicker.tsx 提取为独立模块，供两处共用：
 * - React 组件 IconPicker（设置页/图标库）
 * - FileExplorerIconHandler 的右键菜单「设置图标」（非 React 上下文）
 *
 * 支持 lucide / svg 类型切换、按类型预览、跨窗口（popout）挂载纠偏。
 */
export class IconSelector extends FuzzySuggestModal<string> {
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
			(active?.body ? active : app.workspace.containerEl.ownerDocument);
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

	onChooseItem(item: string): void {
		this.callback(item, this.currentType);
	}
}
