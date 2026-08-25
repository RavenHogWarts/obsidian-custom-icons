import { LL } from "@src/i18n/i18n";
import { IconRef } from "@src/util/iconRef";
import { Star } from "lucide-react";
import { IconCard } from "../icon-card/IconCard";

interface FavoriteStripProps {
	/** 属于当前页的收藏项（调用方按来源过滤） */
	refs: IconRef[];
	onToggleFavorite: (ref: IconRef) => void;
	/** 复用各页自己的动作（如「复制 SVG 源码」/ 编辑 / 删除） */
	onEdit?: (id: string) => void | Promise<void>;
	onDelete?: (id: string) => void;
	customActions?: React.ComponentProps<typeof IconCard>["customActions"];
	/** 图块最小宽度，跟随所在页的密度 */
	minColumnWidth: number;
}

/**
 * 收藏置顶条：钉在网格上方，与图标选择器共享同一份 favorites 数据。
 *
 * 不做虚拟化——收藏是人工挑的，数量以十计；用普通 grid 自动换行即可，
 * 也因此不会跟下方虚拟化网格抢滚动。
 */
export const FavoriteStrip: React.FC<FavoriteStripProps> = ({
	refs,
	onToggleFavorite,
	onEdit,
	onDelete,
	customActions,
	minColumnWidth,
}) => {
	if (refs.length === 0) {
		return null;
	}

	const favorites = LL.view.CustomIconLib.favorites;

	return (
		<div className="ci-lib__favorites">
			<div className="ci-lib__favorites-title">
				<Star className="svg-icon" />
				<span>{favorites.section()}</span>
				<span className="ci-lib__favorites-count">{refs.length}</span>
				<span className="ci-lib__favorites-hint">
					{favorites.hint()}
				</span>
			</div>
			<div
				className="ci-lib__favorites-grid"
				style={{
					gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnWidth}px, 1fr))`,
				}}
			>
				{refs.map((ref) => (
					<IconCard
						key={`${ref.type}:${ref.id}`}
						id={ref.id}
						type={ref.type}
						favorite
						onToggleFavorite={() => onToggleFavorite(ref)}
						onEdit={onEdit}
						onDelete={onDelete}
						customActions={customActions}
					/>
				))}
			</div>
		</div>
	);
};
