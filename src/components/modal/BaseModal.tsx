import CIPlugin from "@src/main";
import { Modal } from "obsidian";
import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";

interface BaseModalProps {
	title?: string;
	onClose: () => void;
}

export interface BaseModalOptions {
	/**
	 * 触发弹窗的元素（弹窗将挂载到该元素所在的窗口）。
	 *
	 * Obsidian 的 Modal 默认挂载到「当前活跃窗口」的 body，但
	 * activeDocument 全局在跨窗口场景下不可靠：设置界面（本身是
	 * 覆盖主窗口的 Modal）打开时，从 popout 窗口的视图触发弹窗，
	 * 弹窗会被错误地叠到主窗口的设置界面上。
	 * 触发元素的 ownerDocument 始终指向用户实际操作的窗口，
	 * 因此作为 targetDoc 的首选来源。
	 */
	sourceEl?: HTMLElement;
}

export class BaseModal<T extends BaseModalProps> extends Modal {
	private root: Root | null = null;
	private componentProps: Omit<T, "onClose">;
	private sizeClass: string | undefined;
	private Component: React.ComponentType<T>;
	/** 弹窗应挂载到的窗口文档 */
	private targetDoc: Document;

	constructor(
		plugin: CIPlugin,
		Component: React.ComponentType<T>,
		componentProps: Omit<T, "onClose">,
		sizeClass?: string,
		options?: BaseModalOptions,
	) {
		super(plugin.app);

		this.Component = Component;
		this.componentProps = componentProps;
		this.sizeClass = sizeClass;
		this.targetDoc = this.resolveTargetDoc(plugin, options?.sourceEl);
	}

	private resolveTargetDoc(
		plugin: CIPlugin,
		sourceEl?: HTMLElement,
	): Document {
		// 优先级：触发元素所在文档 > activeDocument > 工作区（主窗口）文档
		if (sourceEl?.ownerDocument) {
			return sourceEl.ownerDocument;
		}
		const active = activeDocument as Document | undefined;
		if (active?.body) {
			return active;
		}
		return plugin.app.workspace.containerEl.ownerDocument;
	}

	async onOpen(): Promise<void> {
		// 防御性挂载：核心若把弹窗挂到了其他文档（跨窗口错位），
		// 移回目标窗口的 body，保证弹窗出现在用户操作的窗口内
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
