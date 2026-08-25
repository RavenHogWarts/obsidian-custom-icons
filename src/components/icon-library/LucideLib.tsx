import { useIconFavorites } from "@src/hooks/useIconFavorites";
import { useIconGridDensity } from "@src/hooks/useIconGridDensity";
import { useLibShortcuts } from "@src/hooks/useLibShortcuts";
import { LL } from "@src/i18n/i18n";
import { getLucideIconCatalog } from "@src/util/getLucideIcons";
import { compactGridMetrics } from "@src/util/iconGridDensity";
import { IconRef } from "@src/util/iconRef";
import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { IconCard } from "../icon-card/IconCard";
import { DensityToggle } from "./DensityToggle";
import { FavoriteStrip } from "./FavoriteStrip";
import { LibEmptyState } from "./LibEmptyState";
import { LibHandoff, LibNavigate } from "./libNav";
import { VirtualIconGrid } from "./VirtualIconGrid";
import "./IconLib.css";

/** Lucide 页筛选：全部 / Obsidian 内置 / 差异（原生未内置） */
type LucideFilter = "all" | "builtin" | "extra";

const LUCIDE_FILTERS: LucideFilter[] = ["all", "builtin", "extra"];

interface LucideLibProps {
	/** 从其它页交接过来的查询词（挂载时作为初始值） */
	handoff?: LibHandoff;
	/** 请求切到另一页并带上查询词 */
	onNavigate?: LibNavigate;
}

/**
 * Lucide 只读图标页
 * 展示插件引入的 Lucide 图标（按组件去重），支持「全部 / 内置 / 差异」筛选，
 * 不支持编辑，点击图标或名称即可复制图标名称
 */
export const LucideLib: React.FC<LucideLibProps> = ({
	handoff,
	onNavigate,
}) => {
	// Local State
	const [searchQuery, setSearchQuery] = useState(handoff?.query ?? "");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	// 交接进来的查询要跨全部图标搜，否则默认的「差异」筛选会藏掉内置命中项
	const [filter, setFilter] = useState<LucideFilter>(
		handoff ? "all" : "extra",
	);
	const searchRef = useRef<HTMLInputElement>(null);
	const clearSearch = useCallback(() => setSearchQuery(""), []);
	const handleShortcuts = useLibShortcuts(searchRef, clearSearch);

	const [density, setDensity] = useIconGridDensity();
	const favorites = useIconFavorites();
	const metrics = compactGridMetrics(density);

	const lucideFavorites = useMemo(
		() => favorites.refs.filter((ref) => ref.type === "lucide"),
		[favorites.refs],
	);
	const handleToggleFavorite = useCallback(
		(id: string) => void favorites.toggle({ type: "lucide", id }),
		[favorites.toggle],
	);
	const handleToggleFavoriteRef = useCallback(
		(ref: IconRef) => void favorites.toggle(ref),
		[favorites.toggle],
	);

	// 目录计算开销较大（遍历 lucide 全部导出 + Obsidian 注册表比对），仅计算一次
	const catalog = useMemo(() => getLucideIconCatalog(), []);

	// Filter and Sort Icons
	const filteredIcons = useMemo(() => {
		const query = searchQuery.toLowerCase();

		const result = catalog
			.filter((entry) =>
				filter === "all"
					? true
					: (filter === "builtin") === entry.builtin,
			)
			.filter((entry) => !query || entry.name.includes(query))
			.map((entry) => entry.name);

		result.sort((a, b) =>
			sortOrder === "asc" ? a.localeCompare(b) : b.localeCompare(a),
		);

		return result;
	}, [catalog, filter, searchQuery, sortOrder]);

	// Handlers
	const handleToggleSort = () => {
		setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
	};

	// 排序按钮：图标与无障碍标签都随 sortOrder 走，文案全部经 i18n
	const sortLL = LL.view.CustomIconLib.lucide.sort;
	const sortLabel = `${sortLL.label()}: ${
		sortOrder === "asc" ? sortLL.asc() : sortLL.desc()
	}`;

	// 空态：搜索无结果给"清空 / 换页去搜"，筛选无结果给"放宽筛选"
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
				...(filter === "all"
					? []
					: [
							{
								label: LL.view.CustomIconLib.lucide.showAll(),
								onClick: () => setFilter("all"),
							},
						]),
				...(onNavigate
					? [
							{
								label: LL.view.CustomIconLib.empty.searchInSvg({
									query: searchQuery,
								}),
								onClick: () => onNavigate("svg", searchQuery),
							},
						]
					: []),
			]}
		/>
	) : (
		<LibEmptyState
			title={LL.view.CustomIconLib.lucide.emptyFilter()}
			actions={[
				{
					label: LL.view.CustomIconLib.lucide.showAll(),
					onClick: () => setFilter("all"),
					cta: true,
				},
			]}
		/>
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

				<div
					className="ci-lib__filter"
					role="group"
					aria-label={LL.view.CustomIconLib.lucide.filter.group()}
				>
					{LUCIDE_FILTERS.map((key) => (
						<button
							key={key}
							className={`ci-lib__filter-btn${filter === key ? " is-active" : ""}`}
							onClick={() => setFilter(key)}
							aria-pressed={filter === key}
						>
							{LL.view.CustomIconLib.lucide.filter[key]()}
						</button>
					))}
				</div>

				<DensityToggle value={density} onChange={setDensity} />

				<button
					onClick={handleToggleSort}
					aria-label={sortLabel}
					title={sortLabel}
				>
					{sortOrder === "asc" ? (
						<ArrowUpAZ className="svg-icon" />
					) : (
						<ArrowDownAZ className="svg-icon" />
					)}
				</button>
			</div>

			{/* Count and description */}
			<div className="ci-lib__hint">
				<span className="ci-lib__hint-count">
					{LL.view.CustomIconLib.lucide.count({
						count: filteredIcons.length,
					})}
				</span>
				<span className="ci-lib__hint-desc">
					{LL.view.CustomIconLib.lucide.descHints[filter]()}
				</span>
			</div>

			{/* 收藏置顶（搜索时收起，避免与结果混淆） */}
			{!searchQuery && (
				<FavoriteStrip
					refs={lucideFavorites}
					onToggleFavorite={handleToggleFavoriteRef}
					minColumnWidth={metrics.minColumnWidth}
				/>
			)}

			{/* Icon Grid */}
			<VirtualIconGrid
				items={filteredIcons}
				getKey={(name) => name}
				renderItem={(name) => (
					<IconCard
						id={name}
						type="lucide"
						favorite={favorites.isFavorite({
							type: "lucide",
							id: name,
						})}
						onToggleFavorite={handleToggleFavorite}
					/>
				)}
				minColumnWidth={metrics.minColumnWidth}
				estimateRowHeight={metrics.estimateRowHeight}
				className="ci-vgrid--compact"
				emptyState={emptyState}
			/>
		</div>
	);
};
