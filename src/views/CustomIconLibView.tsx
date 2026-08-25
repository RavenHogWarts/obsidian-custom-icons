import { AllLib } from "@src/components/icon-library/AllLib";
import { LibNavigate, LibTabId } from "@src/components/icon-library/libNav";
import { LucideLib } from "@src/components/icon-library/LucideLib";
import { PackLib } from "@src/components/icon-library/PackLib";
import { SvgLib } from "@src/components/icon-library/SvgLib";
import { Tab, TabItem } from "@src/components/tab/Tab";
import { SettingsStoreContext } from "@src/context/SettingsStoreContext";
import { LL } from "@src/i18n/i18n";
import CIPlugin from "@src/main";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { StrictMode, useState } from "react";
import { Root, createRoot } from "react-dom/client";

export const VIEW_TYPE_CUSTOM_ICON_LIB = "custom-icon-lib-view";

/** 跨页搜索交接：nonce 保证同一查询词再次交接也能重新生效 */
interface Handoff {
	tab: LibTabId;
	query: string;
	/** 目标是 pack 页时要直接打开的图标包 */
	packId?: string;
	nonce: number;
}

/**
 * 图标库四页外壳。
 *
 * 持有当前页签，并在页之间传递「搜索交接」——「全部」页里某个来源点
 * 「查看全部」，或某页搜索无结果想换页再找，都带着查询词跳过去
 * （Radix 会卸载非活动页，目标页重新挂载时把 handoff 当作初始状态）。
 */
const IconLibShell: React.FC = () => {
	const [tab, setTab] = useState<LibTabId>("all");
	const [handoff, setHandoff] = useState<Handoff | null>(null);

	const navigate: LibNavigate = (target, query, packId) => {
		setHandoff({ tab: target, query, packId, nonce: Date.now() });
		setTab(target);
	};

	/** 只有交接目标页才拿到查询词 */
	const seed = (id: LibTabId) =>
		handoff?.tab === id
			? { query: handoff.query, packId: handoff.packId }
			: undefined;

	const items: TabItem[] = [
		{
			id: "all",
			title: LL.view.CustomIconLib.all.tabName(),
			content: <AllLib onNavigate={navigate} />,
		},
		{
			id: "pack",
			title: LL.view.CustomIconLib.pack.tabName(),
			content: <PackLib handoff={seed("pack")} />,
		},
		{
			id: "svg",
			title: LL.view.CustomIconLib.svg.tabName(),
			content: <SvgLib handoff={seed("svg")} onNavigate={navigate} />,
		},
		{
			id: "lucide",
			title: LL.view.CustomIconLib.lucide.tabName(),
			content: (
				<LucideLib handoff={seed("lucide")} onNavigate={navigate} />
			),
		},
	];

	return (
		<Tab
			items={items}
			value={tab}
			onChange={(next) => {
				// 用户手动切页：丢弃交接，避免下次回到该页又被旧查询词填上
				setTab(next as LibTabId);
				setHandoff(null);
			}}
		/>
	);
};

export class CustomIconLibView extends ItemView {
	private root: Root;

	constructor(
		leaf: WorkspaceLeaf,
		protected plugin: CIPlugin,
	) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_CUSTOM_ICON_LIB;
	}

	getDisplayText(): string {
		return LL.view.CustomIconLib.name();
	}

	getIcon(): string {
		return "library";
	}

	async onOpen() {
		this.root = createRoot(this.contentEl);
		this.root.render(
			<StrictMode>
				<SettingsStoreContext.Provider
					value={this.plugin.settingsStore}
				>
					<IconLibShell />
				</SettingsStoreContext.Provider>
			</StrictMode>,
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
