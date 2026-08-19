import { LL } from "@src/i18n/i18n";
import { getExtraLucideIconNames } from "@src/util/getLucideIcons";
import { setIcon } from "obsidian";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconCard } from "../icon-card/IconCard";

/**
 * Lucide 只读图标页
 * 展示插件引入的 Lucide 中、Obsidian 原生未内置的图标
 * 不支持编辑，点击图标或名称即可复制图标名称
 */
export const LucideLib: React.FC = () => {
	// Local State
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const sortButtonRef = useRef<HTMLButtonElement>(null);

	// 差集计算开销较大（遍历 lucide 全部导出），仅计算一次
	const allIcons = useMemo(() => getExtraLucideIconNames(), []);

	// Filter and Sort Icons
	const filteredIcons = useMemo(() => {
		const result = allIcons.filter(
			(name) =>
				!searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase()),
		);

		result.sort((a, b) => {
			return sortOrder === "asc"
				? a.localeCompare(b)
				: b.localeCompare(a);
		});

		return result;
	}, [allIcons, searchQuery, sortOrder]);

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
			</div>

			{/* Count and description */}
			<div className="ci-lib__hint">
				<span className="ci-lib__hint-count">
					{LL.view.CustomIconLib.lucide.count({
						count: filteredIcons.length,
					})}
				</span>
				<span className="ci-lib__hint-desc">
					{LL.view.CustomIconLib.lucide.descHint()}
				</span>
			</div>

			{/* Icon Grid */}
			<div className="ci-lib__grid ci-lib__grid--lucide">
				{filteredIcons.map((name) => (
					<IconCard key={name} id={name} type="lucide" />
				))}
			</div>
		</div>
	);
};
