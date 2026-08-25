import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import { useResponsiveColumns } from "./useResponsiveColumns";

interface VirtualIconGridProps<T> {
	/** 完整数据列表（过滤/排序后的结果，全量传入即可） */
	items: T[];
	/** 稳定的行内 key（图标名/ID），避免换行时错误复用 DOM */
	getKey: (item: T) => string;
	/** 渲染单个图标卡片 */
	renderItem: (item: T) => React.ReactNode;
	/** 单列最小宽度，对齐原 CSS minmax 下限（默认 100，Lucide 页建议 130） */
	minColumnWidth?: number;
	/** 网格间距（像素，需与 --size-4-3 对齐，默认 12）：同时用于行内列间距与行间距 */
	gap?: number;
	/** 行内容高度估算值（首帧使用，随后由 measureElement 实测校正；行间距由 gap 另行叠加） */
	estimateRowHeight?: number;
	/** 透传到滚动视口，复用既有网格外观（如 ci-vgrid--compact 紧凑只读风格） */
	className?: string;
	/**
	 * items 为空时替代网格渲染的内容（空态 / 无结果 / 加载骨架）。
	 * 未传则保持原行为：什么都不画。
	 */
	emptyState?: React.ReactNode;
	/**
	 * 报告当前列数。外部做方向键走位时需要它把「左右」与「上下」换算成下标增量。
	 */
	onColumnsChange?: (columns: number) => void;
	/**
	 * 需要滚动进可视区的条目下标（受控）。
	 * 每次变化都会滚动，因此调用方用它跟随「当前高亮项」即可。
	 */
	scrollToIndex?: number;
}

/**
 * 行虚拟化图标网格：只挂载可视区 + overscan 的卡片，替代全量 map。
 *
 * 响应式列数由 useResponsiveColumns 测量得出，随后把「每 columns 个图标」聚成
 * 一行做行虚拟化；行内部再用 grid 铺开，视觉与原 auto-fill 网格一致。
 */
export function VirtualIconGrid<T>({
	items,
	getKey,
	renderItem,
	minColumnWidth = 100,
	gap = 12,
	estimateRowHeight = 130,
	className = "",
	emptyState,
	onColumnsChange,
	scrollToIndex,
}: VirtualIconGridProps<T>) {
	const parentRef = useRef<HTMLDivElement>(null);
	const columns = useResponsiveColumns(parentRef, minColumnWidth, gap);
	const rowCount = Math.ceil(items.length / columns);

	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => parentRef.current,
		// 每行占位 = 行高 + 行间距：绝对定位行按占位累加偏移，行间才能留出 gap
		estimateSize: () => estimateRowHeight + gap,
		overscan: 4,
		measureElement: (el) => el.getBoundingClientRect().height + gap,
	});

	useEffect(() => {
		onColumnsChange?.(columns);
	}, [columns, onColumnsChange]);

	// 跟随外部高亮项滚动。rowVirtualizer 每次渲染都是新引用，
	// 放进依赖会无限循环，故只依赖真正的触发源。
	const scrollRef = useRef(rowVirtualizer);
	scrollRef.current = rowVirtualizer;
	useEffect(() => {
		if (scrollToIndex === undefined || scrollToIndex < 0) {
			return;
		}
		scrollRef.current.scrollToIndex(Math.floor(scrollToIndex / columns), {
			align: "auto",
		});
	}, [scrollToIndex, columns]);

	// 空态渲染在视口内部（而非取代视口）：parentRef 始终挂载，
	// 否则 useResponsiveColumns 的 ResizeObserver 会在首次有数据时仍停留在 1 列。
	return (
		<div ref={parentRef} className={`ci-vgrid__viewport ${className}`}>
			{items.length === 0 && emptyState ? (
				emptyState
			) : (
				<div
					className="ci-vgrid__sizer"
					style={{
						height: rowVirtualizer.getTotalSize(),
						position: "relative",
					}}
				>
					{rowVirtualizer.getVirtualItems().map((vRow) => {
						const start = vRow.index * columns;
						const rowItems = items.slice(start, start + columns);
						return (
							<div
								key={vRow.key}
								data-index={vRow.index}
								ref={rowVirtualizer.measureElement}
								className="ci-vgrid__row"
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									transform: `translateY(${vRow.start}px)`,
									gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
									gap,
								}}
							>
								{rowItems.map((item) => (
									<div key={getKey(item)}>
										{renderItem(item)}
									</div>
								))}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
