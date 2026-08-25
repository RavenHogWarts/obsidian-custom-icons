import { useIconFavorites } from "@src/hooks/useIconFavorites";
import { useIconGridDensity } from "@src/hooks/useIconGridDensity";
import { useLibShortcuts } from "@src/hooks/useLibShortcuts";
import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { LL } from "@src/i18n/i18n";
import { compactGridMetrics } from "@src/util/iconGridDensity";
import { IconRef } from "@src/util/iconRef";
import { rankIcons } from "@src/util/iconSearch";
import { buildIconSources } from "@src/util/iconSources";
import { ArrowRight, Search } from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import { IconCard } from "../icon-card/IconCard";
import { DensityToggle } from "./DensityToggle";
import { FavoriteStrip } from "./FavoriteStrip";
import { LibEmptyState } from "./LibEmptyState";
import { LibNavigate, LibTabId } from "./libNav";
import "./IconLib.css";

/** 每个来源先给这么多，剩下的交给「查看全部」跳到对应页 */
const PREVIEW_COUNT = 24;

/** 来源 id → 目标页 + 图标包 id（`pack:{id}` 要跳进该包的详情） */
function resolveTarget(sourceId: string): {
	tab: LibTabId;
	packId?: string;
} {
	if (sourceId === "lucide" || sourceId === "svg") {
		return { tab: sourceId };
	}
	return { tab: "pack", packId: sourceId.slice("pack:".length) };
}

interface AllLibProps {
	onNavigate?: LibNavigate;
}

/**
 * 「全部」页：一个输入框跨所有来源搜索，结果按来源分组。
 *
 * 解决「想找一个图标得先猜它属于 Lucide、我的 SVG 还是某个包」——
 * 每组只展示前 PREVIEW_COUNT 个，要看全部再跳到对应页（携带查询词）。
 */
export const AllLib: React.FC<AllLibProps> = ({ onNavigate }) => {
	const store = useSettingsStore();
	const settings = usePluginSettings(store);
	const [density, setDensity] = useIconGridDensity();
	const favorites = useIconFavorites();

	const [searchQuery, setSearchQuery] = useState("");
	// 跨全部来源检索让给渲染优先：输入不卡，结果稍后跟上
	const deferredQuery = useDeferredValue(searchQuery);
	const searchRef = useRef<HTMLInputElement>(null);
	const clearSearch = useCallback(() => setSearchQuery(""), []);
	const handleShortcuts = useLibShortcuts(searchRef, clearSearch);

	const metrics = compactGridMetrics(density);
	const all = LL.view.CustomIconLib.all;

	// 图标包内容只在内存缓存里读，随启用状态与用户 SVG 变化重建
	const sources = useMemo(
		() => buildIconSources(store.plugin),
		[store.plugin, settings.customIconLib.svg, settings.customIconLib.packs],
	);

	const results = useMemo(() => {
		const trimmed = deferredQuery.trim();
		if (!trimmed) {
			return [];
		}
		return sources
			.map((source) => {
				const { indices, total } = rankIcons(
					source.keys,
					trimmed,
					PREVIEW_COUNT,
				);
				return {
					source,
					items: indices.map((index) => source.entries[index]),
					total,
				};
			})
			.filter((result) => result.total > 0);
	}, [sources, deferredQuery]);

	const handleToggleFavorite = useCallback(
		(ref: IconRef) => void favorites.toggle(ref),
		[favorites.toggle],
	);

	const hasQuery = deferredQuery.trim() !== "";

	return (
		<div
			className="ci-lib-container"
			tabIndex={-1}
			onKeyDown={handleShortcuts}
		>
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
			</div>

			<div className="ci-lib__hint">
				<span className="ci-lib__hint-desc">{all.hint()}</span>
			</div>

			<div className="ci-lib__scroll">
				{!hasQuery && (
					<>
						<FavoriteStrip
							refs={favorites.refs}
							onToggleFavorite={handleToggleFavorite}
							minColumnWidth={metrics.minColumnWidth}
						/>
						<LibEmptyState
							icon={<Search className="svg-icon" />}
							title={all.prompt()}
						/>
					</>
				)}

				{hasQuery && results.length === 0 && (
					<LibEmptyState
						title={LL.view.CustomIconLib.empty.noResults({
							query: deferredQuery.trim(),
						})}
						actions={[
							{
								label: LL.view.CustomIconLib.empty.clearSearch(),
								onClick: clearSearch,
							},
						]}
					/>
				)}

				{hasQuery &&
					results.map(({ source, items, total }) => {
						const target = resolveTarget(source.id);
						return (
							<div key={source.id} className="ci-lib__group">
								<div className="ci-lib__group-title">
									<span className="ci-lib__group-label">
										{source.label}
									</span>
									<span className="ci-lib__group-count">
										{LL.view.CustomIconLib.picker.matchCount(
											{ count: total },
										)}
									</span>
									{total > items.length && onNavigate && (
										<button
											className="ci-lib__group-more"
											onClick={() =>
												onNavigate(
													target.tab,
													deferredQuery.trim(),
													target.packId,
												)
											}
										>
											{all.showAll({ count: total })}
											<ArrowRight className="svg-icon" />
										</button>
									)}
								</div>
								<div
									className="ci-lib__group-grid"
									style={{
										gridTemplateColumns: `repeat(auto-fill, minmax(${metrics.minColumnWidth}px, 1fr))`,
									}}
								>
									{items.map((entry) => (
										<IconCard
											key={`${entry.type}:${entry.id}`}
											id={entry.id}
											type={entry.type}
											favorite={favorites.isFavorite(
												entry,
											)}
											onToggleFavorite={() =>
												handleToggleFavorite(entry)
											}
										/>
									))}
								</div>
							</div>
						);
					})}
			</div>
		</div>
	);
};
