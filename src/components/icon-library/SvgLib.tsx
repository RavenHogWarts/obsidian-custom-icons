import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { LL } from "@src/i18n/i18n";
import { ICustomSVGIcon } from "@src/types/types";
import { uniqueIconId } from "@src/util/svgUtils";
import { CirclePlus, Code, Shapes } from "lucide-react";
import { Notice, setIcon } from "obsidian";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CustomAction, IconCard } from "../icon-card/IconCard";
import { ConfirmDialog } from "../modal/ConfirmDialog";
import {
	AddSvg,
	AddSvgResult,
	DuplicateStrategy,
	PendingIcon,
} from "./AddSvg";
import { EditSvg } from "./EditSvg";
import { LibEmptyState } from "./LibEmptyState";
import { LibHandoff, LibNavigate } from "./libNav";
import { VirtualIconGrid } from "./VirtualIconGrid";
import "./IconLib.css";

interface SvgLibProps {
	/** 从其它页交接过来的查询词（挂载时作为初始值） */
	handoff?: LibHandoff;
	/** 请求切到另一页并带上查询词 */
	onNavigate?: LibNavigate;
}

export const SvgLib: React.FC<SvgLibProps> = ({ handoff, onNavigate }) => {
	const store = useSettingsStore();
	const settings = usePluginSettings(store);

	// Local State
	const [searchQuery, setSearchQuery] = useState(handoff?.query ?? "");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const sortButtonRef = useRef<HTMLButtonElement>(null);

	const svgIcons = settings.customIconLib.svg;
	const existingIds = useMemo(() => svgIcons.map((i) => i.id), [svgIcons]);

	// Filter and Sort Icons
	const filteredIcons = useMemo(() => {
		const icons = [...svgIcons]; // Shallow copy

		const result = icons.filter(
			(icon) =>
				!searchQuery ||
				icon.id.toLowerCase().includes(searchQuery.toLowerCase()),
		);

		result.sort((a, b) => {
			return sortOrder === "asc"
				? a.id.localeCompare(b.id)
				: b.id.localeCompare(a.id);
		});

		return result;
	}, [svgIcons, searchQuery, sortOrder]);

	// Update sort button icon when sortOrder changes
	useEffect(() => {
		if (sortButtonRef.current) {
			sortButtonRef.current.empty();
			const iconName =
				sortOrder === "asc" ? "arrow-up-az" : "arrow-up-za";
			setIcon(sortButtonRef.current, iconName);
		}
	}, [sortOrder]);

	// Handlers
	const handleToggleSort = () => {
		setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
	};

	/**
	 * 按冲突策略合并写入，并如实回报发生了什么。
	 *
	 * 同批次内也会撞名（两个同名文件），因此 taken 边写边补。
	 */
	const handleSubmit = async (
		icons: PendingIcon[],
		strategy: DuplicateStrategy,
	): Promise<AddSvgResult> => {
		const current = settings.customIconLib.svg;
		const next: ICustomSVGIcon[] = [...current];
		const taken = new Set(current.map((icon) => icon.id));
		const result: AddSvgResult = { added: 0, overwritten: 0, skipped: [] };

		for (const icon of icons) {
			if (!taken.has(icon.id)) {
				next.push(icon);
				taken.add(icon.id);
				result.added++;
				continue;
			}
			if (strategy === "overwrite") {
				const index = next.findIndex((i) => i.id === icon.id);
				next[index] = icon;
				result.overwritten++;
				continue;
			}
			if (strategy === "rename") {
				const id = uniqueIconId(icon.id, taken);
				next.push({ ...icon, id });
				taken.add(id);
				result.added++;
				continue;
			}
			result.skipped.push(icon.id);
		}

		if (result.added > 0 || result.overwritten > 0) {
			await store.updateSettingByPath("customIconLib.svg", next);
		}
		return result;
	};

	const handleOpenAddModal = (sourceEl?: HTMLElement) => {
		let submitFn: (() => Promise<boolean>) | null = null;

		new ConfirmDialog(
			store.plugin,
			{
				title:
					LL.common.add() + " " + LL.view.CustomIconLib.svg.tabName(),
				confirmLL: LL.common.add(),
				children: (
					<AddSvg
						existingIds={existingIds}
						onSubmit={handleSubmit}
						onReady={(submit) => {
							submitFn = submit;
						}}
					/>
				),
				// 表单自行校验并解释；返回 false 时弹窗保持打开
				onConfirm: async () => (submitFn ? await submitFn() : false),
			},
			{ sourceEl },
		).open();
	};

	const handleDeleteIcon = useCallback(
		(iconId: string) => {
			new ConfirmDialog(store.plugin, {
				title: `${LL.common.delete()} "${iconId}"?`,
				confirmLL: LL.common.delete(),
				onConfirm: async () => {
					const currentSvgIcons = settings.customIconLib.svg;
					const newSvgIcons = currentSvgIcons.filter(
						(icon) => icon.id !== iconId,
					);
					await store.updateSettingByPath(
						"customIconLib.svg",
						newSvgIcons,
					);
				},
			}).open();
		},
		[store, settings.customIconLib.svg],
	);

	const handleEditIcon = async (
		iconId: string,
		newIconId: string,
		newIconContent: string,
	): Promise<boolean> => {
		const currentSvgIcons = settings.customIconLib.svg;
		const iconIndex = currentSvgIcons.findIndex(
			(icon) => icon.id === iconId,
		);

		// 原图标已不存在（例如在另一窗口被删）：不写入，让弹窗保持打开
		if (iconIndex === -1) {
			return false;
		}

		const newSvgIcons = [...currentSvgIcons];
		newSvgIcons[iconIndex] = {
			id: newIconId,
			content: newIconContent,
		};

		await store.updateSettingByPath("customIconLib.svg", newSvgIcons);
		return true;
	};

	const handleOpenEditModal = useCallback(
		async (iconId: string) => {
			const icon = settings.customIconLib.svg.find(
				(icon) => icon.id === iconId,
			);
			if (!icon) {
				return;
			}

			let submitFn: (() => Promise<boolean>) | null = null;

			new ConfirmDialog(store.plugin, {
				title:
					LL.common.edit() +
					" " +
					LL.view.CustomIconLib.svg.tabName(),
				confirmLL: LL.common.save(),
				children: (
					<EditSvg
						iconId={icon.id}
						iconContent={icon.content}
						// 排除自身：不改名时不应报重名
						existingIds={settings.customIconLib.svg
							.filter((i) => i.id !== icon.id)
							.map((i) => i.id)}
						onSubmit={(newIconId, newIconContent) =>
							handleEditIcon(iconId, newIconId, newIconContent)
						}
						onReady={(submit) => {
							submitFn = submit;
						}}
					/>
				),
				onConfirm: async () => (submitFn ? await submitFn() : false),
			}).open();
		},
		[store, settings.customIconLib.svg],
	);

	const handleCopySvgCode = useCallback(
		async (iconId: string) => {
			const icon = settings.customIconLib.svg.find(
				(icon) => icon.id === iconId,
			);
			if (!icon) {
				return;
			}

			try {
				await navigator.clipboard.writeText(icon.content);
				new Notice(`Copied SVG code: ${iconId}`);
			} catch (err) {
				console.error("Failed to copy SVG code:", err);
				new Notice("Failed to copy SVG code");
			}
		},
		[settings.customIconLib.svg],
	);

	// 稳定的 props 引用：配合 IconCard 的 memo，避免网格重渲时全量重执行
	const copyAction = useMemo<CustomAction[]>(
		() => [
			{
				icon: <Code className="svg-icon" />,
				title: LL.view.CustomIconLib.svg.copyAction(),
				onClick: (id: string) => void handleCopySvgCode(id),
			},
		],
		[handleCopySvgCode],
	);

	// 空态：搜索无结果给"清空 / 换页去搜"，空库给"添加"引导
	const emptyState = searchQuery ? (
		<LibEmptyState
			title={LL.view.CustomIconLib.empty.noResults({
				query: searchQuery,
			})}
			actions={[
				{
					label: LL.view.CustomIconLib.empty.clearSearch(),
					onClick: () => setSearchQuery(""),
				},
				...(onNavigate
					? [
							{
								label: LL.view.CustomIconLib.empty.searchInLucide(
									{ query: searchQuery },
								),
								onClick: () =>
									onNavigate("lucide", searchQuery),
							},
						]
					: []),
			]}
		/>
	) : (
		<LibEmptyState
			icon={<Shapes className="svg-icon" />}
			title={LL.view.CustomIconLib.svg.emptyTitle()}
			desc={LL.view.CustomIconLib.svg.emptyDesc()}
			actions={[
				{
					label: LL.view.CustomIconLib.svg.emptyAction(),
					onClick: (e) => handleOpenAddModal(e.currentTarget),
					cta: true,
				},
			]}
		/>
	);

	return (
		<div className="ci-lib-container">
			{/* Navigation Bar */}
			<div className="ci-lib__toolbar">
				<div className="ci-lib__search">
					<input
						type="search"
						placeholder={LL.view.CustomIconLib.searchPlaceholder()}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>

				<button
					ref={sortButtonRef}
					onClick={handleToggleSort}
					aria-label={sortOrder === "asc" ? "A-Z" : "Z-A"}
				/>

				<button onClick={(e) => handleOpenAddModal(e.currentTarget)}>
					<CirclePlus className="svg-icon" />
				</button>
			</div>

			{/* Icon Grid */}
			<VirtualIconGrid
				items={filteredIcons}
				getKey={(icon) => icon.id}
				renderItem={(icon) => (
					<IconCard
						id={icon.id}
						onDelete={handleDeleteIcon}
						onEdit={handleOpenEditModal}
						customActions={copyAction}
					/>
				)}
				emptyState={emptyState}
			/>
		</div>
	);
};
