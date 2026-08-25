import { LL } from "@src/i18n/i18n";
import { getLucideIconCatalog } from "@src/util/getLucideIcons";
import { setIcon } from "obsidian";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconCard } from "../icon-card/IconCard";
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
	const sortButtonRef = useRef<HTMLButtonElement>(null);

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

				<button
					ref={sortButtonRef}
					onClick={handleToggleSort}
					aria-label={sortOrder === "asc" ? "A-Z" : "Z-A"}
				/>
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

			{/* Icon Grid */}
			<VirtualIconGrid
				items={filteredIcons}
				getKey={(name) => name}
				renderItem={(name) => <IconCard id={name} type="lucide" />}
				minColumnWidth={92}
				estimateRowHeight={88}
				className="ci-vgrid--compact"
				emptyState={emptyState}
			/>
		</div>
	);
};
