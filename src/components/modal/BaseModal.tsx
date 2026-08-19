import CIPlugin from "@src/main";
import { Modal } from "obsidian";
import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";

interface BaseModalProps {
	title?: string;
	onClose: () => void;
}

export class BaseModal<T extends BaseModalProps> extends Modal {
	private root: Root | null = null;
	private componentProps: Omit<T, "onClose">;
	private sizeClass: string | undefined;
	private Component: React.ComponentType<T>;
	/**
	 * 触发弹窗时所在的窗口文档。
	 *
	 * Obsidian 的 Modal 默认挂载到「当前活跃窗口」，但 activeDocument
	 * 可能滞后于实际触发上下文——典型场景：设置界面（本身是一个覆盖
	 * 主窗口的 Modal）打开时，从 popout 窗口触发弹窗，结果弹窗被错误地
	 * 叠到主窗口的设置界面上。构造发生在用户点击的同步栈中，此刻的
	 * activeDocument 即触发窗口，记录下来供 onOpen 校正挂载目标。
	 */
	private targetDoc: Document;

	constructor(
		plugin: CIPlugin,
		Component: React.ComponentType<T>,
		componentProps: Omit<T, "onClose">,
		sizeClass?: string,
	) {
		super(plugin.app);

		this.Component = Component;
		this.componentProps = componentProps;
		this.sizeClass = sizeClass;
		this.targetDoc =
			activeDocument ?? plugin.app.workspace.containerEl.ownerDocument;
	}

	async onOpen(): Promise<void> {
		// 防御性挂载：核心若把弹窗挂到了其他文档（跨窗口错位），
		// 移回触发窗口的 body，保证弹窗出现在用户操作的窗口内
		if (this.containerEl.ownerDocument !== this.targetDoc) {
			this.targetDoc.body.appendChild(this.containerEl);
		}

		const { modalEl, contentEl } = this;
		modalEl.addClass("ci-modal");
		if (this.sizeClass) {
			modalEl.addClass(this.sizeClass);
		}

		this.setTitle(this.componentProps["title"] || "");

		this.root = createRoot(contentEl);
		this.root.render(
			<StrictMode>
				<this.Component
					{...(this.componentProps as T)}
					onClose={() => this.close()}
				/>
			</StrictMode>,
		);
	}

	onClose(): void {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
		this.containerEl.empty();
	}
}
