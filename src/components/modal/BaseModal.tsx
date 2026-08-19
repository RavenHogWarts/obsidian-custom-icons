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
	}

	async onOpen(): Promise<void> {
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
