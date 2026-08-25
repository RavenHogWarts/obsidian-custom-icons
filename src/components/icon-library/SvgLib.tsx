import { useIconFavorites } from "@src/hooks/useIconFavorites";
import { useIconGridDensity } from "@src/hooks/useIconGridDensity";
import { useLibShortcuts } from "@src/hooks/useLibShortcuts";
import { useLibUIPrefLocal } from "@src/hooks/useLibUIPref";
import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { LL } from "@src/i18n/i18n";
import { ICustomSVGIcon } from "@src/types/types";
import { cardGridMetrics } from "@src/util/iconGridDensity";
import { IconRef } from "@src/util/iconRef";
import { forgetIcons, renameIconInLists } from "@src/util/iconRefCleanup";
import {
	applySelectionClick,
	dropFromSelection,
	emptySelection,
} from "@src/util/iconSelection";
import {
	nextSvgSortMode,
	normalizeSvgSortMode,
	serializeSvgLibrary,
	sortSvgIcons,
	svgLibraryExportName,
} from "@src/util/svgLibrary";
import { uniqueIconId } from "@src/util/svgUtils";
import {
	ArrowDownAZ,
	ArrowUpAZ,
	CirclePlus,
	Clock,
	Download,
	Shapes,
} from "lucide-react";
import { Notice } from "obsidian";
import { useCallback, useMemo, useRef, useState } from "react";
import { CustomAction, IconCard } from "../icon-card/IconCard";
import { ConfirmDialog } from "../modal/ConfirmDialog";
import {
	AddSvg,
	AddSvgResult,
	DuplicateStrategy,
	PendingIcon,
} from "./AddSvg";
import { DensityToggle } from "./DensityToggle";
import { EditSvg } from "./EditSvg";
import { FavoriteStrip } from "./FavoriteStrip";
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
	const [density, setDensity] = useIconGridDensity();
	const favorites = useIconFavorites();

	// Local State
	const [searchQuery, setSearchQuery] = useState(handoff?.query ?? "");
	// 排序偏好落盘在 ui.svgSort（重开视图保持），渲染读本地状态避免每次轮换都等 applyAll
	const [sortMode, setSortMode] = useLibUIPrefLocal(
		"svgSort",
		normalizeSvgSortMode,
	);
	const [selection, setSelection] = useState(emptySelection);
	const selected = selection.selected;
	const searchRef = useRef<HTMLInputElement>(null);
	const clearSearch = useCallback(() => setSearchQuery(""), []);
	const handleShortcuts = useLibShortcuts(searchRef, clearSearch);

	const svgIcons = settings.customIconLib.svg;
	const existingIds = useMemo(() => svgIcons.map((i) => i.id), [svgIcons]);
	const metrics = cardGridMetrics(density);
	const svgLL = LL.view.CustomIconLib.svg;

	// 本页的收藏 = 类型为 svg 且确实是用户导入的图标（排除图标包的 CI-* 项）
	const ownFavorites = useMemo(() => {
		const own = new Set(existingIds);
		return favorites.refs.filter(
			(ref) => ref.type === "svg" && own.has(ref.id),
		);
	}, [favorites.refs, existingIds]);

	// Filter and Sort Icons
	const filteredIcons = useMemo(() => {
		const query = searchQuery.toLowerCase();
		const matched = svgIcons.filter(
			(icon) => !query || icon.id.toLowerCase().includes(query),
		);
		return sortSvgIcons(matched, sortMode);
	}, [svgIcons, searchQuery, sortMode]);

	// Handlers
	const handleToggleSort = () => {
		setSortMode(nextSvgSortMode(sortMode));
	};

	/**
	 * 多选：Ctrl/Cmd 加选单个，Shift 从锚点连选一段。
	 *
	 * 选区与锚点合并成一个 state：先前把锚点放在 useRef 里、在 `setSelected`
	 * 的更新函数里读它——而更新函数是稍后才执行的，那时锚点已被本次点击改写，
	 * 于是连选永远退化成"只选中一个"。逻辑现已抽到 util/iconSelection.ts 并有测试。
	 *
	 * 无修饰键的普通点击仍然是「复制名称」——不因为进入了选择状态就改变主动作，
	 * 否则用户点一下想复制、结果只是选中，会很别扭。
	 */
	const handleModifierClick = useCallback(
		(id: string, mods: { toggle: boolean; range: boolean }) => {
			const ids = filteredIcons.map((icon) => icon.id);
			setSelection((prev) => applySelectionClick(prev, ids, id, mods));
		},
		[filteredIcons],
	);

	const clearSelection = useCallback(() => {
		setSelection(emptySelection());
	}, []);

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
		const now = Date.now();
		// 导入自带 addedAt 时保留原值，其余补当前时间（供「最近添加」排序）
		const stamp = (icon: PendingIcon): ICustomSVGIcon => ({
			...icon,
			addedAt: icon.addedAt ?? now,
		});

		for (const icon of icons) {
			if (!taken.has(icon.id)) {
				next.push(stamp(icon));
				taken.add(icon.id);
				result.added++;
				continue;
			}
			if (strategy === "overwrite") {
				const index = next.findIndex((i) => i.id === icon.id);
				next[index] = stamp(icon);
				result.overwritten++;
				continue;
			}
			if (strategy === "rename") {
				const id = uniqueIconId(icon.id, taken);
				next.push({ ...stamp(icon), id });
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
				title: svgLL.modal.addTitle(),
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
					// 收藏 / 最近里的键不会随图标本体消失，留着就是一格空白
					await forgetIcons(store, [{ type: "svg", id: iconId }]);
					// 选区里同步剔掉：否则「已选 N」会把删掉的项一直算进去，
					// 而「导出所选」按 id 过滤时又找不到它——计数会骗人
					setSelection((prev) =>
						prev.selected.has(iconId)
							? dropFromSelection(prev, iconId)
							: prev,
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
			...currentSvgIcons[iconIndex],
			id: newIconId,
			content: newIconContent,
		};

		await store.updateSettingByPath("customIconLib.svg", newSvgIcons);
		// 改名相当于旧 id 消失、新 id 出现：把收藏 / 最近里的键原位迁过去，
		// 否则改个名字就把收藏弄丢了
		await renameIconInLists(
			store,
			{ type: "svg", id: iconId },
			{ type: "svg", id: newIconId },
		);
		return true;
	};

	const handleOpenEditModal = useCallback(
		async (iconId: string) => {
			const icon = settings.customIconLib.svg.find(
				(icon) => icon.id === iconId,
			);
			// 图标已不在（例如在另一窗口被删、或右键菜单开着时被批量删掉）：
			// 说一句再退出，不然点了「编辑」什么都不发生，又是一处静默失败
			if (!icon) {
				new Notice(svgLL.modal.targetMissing());
				return;
			}

			let submitFn: (() => Promise<boolean>) | null = null;

			new ConfirmDialog(store.plugin, {
				title: svgLL.modal.editTitle(),
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
		[store, settings.customIconLib.svg, svgLL],
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
				new Notice(svgLL.copiedCode({ id: iconId }));
			} catch (err) {
				console.error("Failed to copy SVG code:", err);
				new Notice(
					LL.view.CustomIconLib.card.copySvgCodeFailed(),
				);
			}
		},
		[settings.customIconLib.svg, svgLL],
	);

	const handleDeleteSelected = () => {
		const ids = Array.from(selected);
		if (ids.length === 0) {
			return;
		}
		new ConfirmDialog(store.plugin, {
			title: svgLL.selection.deleteConfirm({ count: ids.length }),
			confirmLL: LL.common.delete(),
			onConfirm: async () => {
				const drop = new Set(ids);
				await store.updateSettingByPath(
					"customIconLib.svg",
					settings.customIconLib.svg.filter(
						(icon) => !drop.has(icon.id),
					),
				);
				await forgetIcons(
					store,
					ids.map((id) => ({ type: "svg" as const, id })),
				);
				clearSelection();
			},
		}).open();
	};

	/**
	 * 导出为 JSON 落到 vault 根目录。
	 *
	 * 不走 `<a download>`：Obsidian 的沙箱里由页面自己发起的下载会被拦掉，
	 * 写进 vault 再把路径告诉用户，是这里唯一稳妥的做法。
	 */
	const handleExport = async (onlySelected: boolean) => {
		const source = settings.customIconLib.svg;
		const icons = onlySelected
			? source.filter((icon) => selected.has(icon.id))
			: source;
		if (icons.length === 0) {
			new Notice(svgLL.exportLib.empty());
			return;
		}
		const path = svgLibraryExportName(new Date());
		try {
			await store.app.vault.adapter.write(
				path,
				serializeSvgLibrary(icons),
			);
			new Notice(
				svgLL.exportLib.done({ count: icons.length, path }),
			);
		} catch (error) {
			console.error("Failed to export icon library:", error);
			new Notice(svgLL.exportLib.failed());
		}
	};

	// 稳定的 props 引用：配合 IconCard 的 memo，避免网格重渲时全量重执行
	const copyAction = useMemo<CustomAction[]>(
		() => [
			{
				icon: "code",
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

	const handleToggleFavorite = useCallback(
		(id: string) => void favorites.toggle({ type: "svg", id }),
		[favorites.toggle],
	);
	const handleToggleFavoriteRef = useCallback(
		(ref: IconRef) => void favorites.toggle(ref),
		[favorites.toggle],
	);

	return (
		<div
			className="ci-lib-container"
			tabIndex={-1}
			onKeyDown={handleShortcuts}
		>
			{/* Navigation Bar */}
			<div className="ci-lib__toolbar">
				<div className="ci-lib__search">
					<input
						ref={searchRef}
						type="search"
						placeholder={LL.view.CustomIconLib.searchPlaceholder()}
						title={LL.view.CustomIconLib.searchHint()}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>

				<DensityToggle value={density} onChange={setDensity} />

				<button
					className="clickable-icon"
					onClick={handleToggleSort}
					aria-label={`${svgLL.sort.label()}: ${svgLL.sort[sortMode]()}`}
					title={`${svgLL.sort.label()}: ${svgLL.sort[sortMode]()}`}
				>
					{sortMode === "name-asc" ? (
						<ArrowUpAZ className="svg-icon" />
					) : sortMode === "name-desc" ? (
						<ArrowDownAZ className="svg-icon" />
					) : (
						<Clock className="svg-icon" />
					)}
				</button>

				<button
					className="clickable-icon"
					onClick={() => void handleExport(false)}
					aria-label={svgLL.exportLib.tooltip()}
					title={svgLL.exportLib.tooltip()}
				>
					<Download className="svg-icon" />
				</button>

				<button
					className="clickable-icon"
					onClick={(e) => handleOpenAddModal(e.currentTarget)}
					aria-label={svgLL.modal.addTitle()}
					title={svgLL.modal.addTitle()}
				>
					<CirclePlus className="svg-icon" />
				</button>
			</div>

			{/* 批量条：有选中项时出现，不挤占工具栏，搜索仍可用 */}
			{selected.size > 0 && (
				<div className="ci-lib__batch">
					<span className="ci-lib__batch-count">
						{svgLL.selection.count({ count: selected.size })}
					</span>
					<button onClick={handleDeleteSelected}>
						{svgLL.selection.deleteSelected()}
					</button>
					<button onClick={() => void handleExport(true)}>
						{svgLL.selection.exportSelected()}
					</button>
					<button onClick={clearSelection}>
						{svgLL.selection.clear()}
					</button>
				</div>
			)}

			{/* 多选手势不写出来就没人知道：常驻一行淡提示 */}
			{filteredIcons.length > 0 && (
				<div className="ci-lib__hint">
					<span className="ci-lib__hint-desc">
						{svgLL.selection.hint()}
					</span>
				</div>
			)}

			{/* 收藏置顶（搜索时收起，避免与结果混淆） */}
			{!searchQuery && (
				<FavoriteStrip
					refs={ownFavorites}
					onToggleFavorite={handleToggleFavoriteRef}
					onEdit={handleOpenEditModal}
					onDelete={handleDeleteIcon}
					customActions={copyAction}
					minColumnWidth={metrics.minColumnWidth}
				/>
			)}

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
						favorite={favorites.isFavorite({
							type: "svg",
							id: icon.id,
						})}
						onToggleFavorite={handleToggleFavorite}
						selected={selected.has(icon.id)}
						onModifierClick={handleModifierClick}
					/>
				)}
				minColumnWidth={metrics.minColumnWidth}
				estimateRowHeight={metrics.estimateRowHeight}
				emptyState={emptyState}
			/>
		</div>
	);
};
