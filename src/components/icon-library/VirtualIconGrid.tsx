import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
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
	/** 列间距（像素，需与 --size-4-3 对齐，默认 12） */
	gap?: number;
	/** 行高估算值（首帧使用，随后由 measureElement 实测校正） */
	estimateRowHeight?: number;
	/** 透传到滚动视口，复用既有网格外观（如 ci-vgrid--compact 紧凑只读风格） */
	className?: string;
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
}: VirtualIconGridProps<T>) {
	const parentRef = useRef<HTMLDivElement>(null);
	const columns = useResponsiveColumns(parentRef, minColumnWidth, gap);
	const rowCount = Math.ceil(items.length / columns);

	const rowVirtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => parentRef.current,
		estimateSize: () => estimateRowHeight,
		overscan: 4,
		measureElement: (el) => el.getBoundingClientRect().height,
	});

	return (
		<div ref={parentRef} className={`ci-vgrid__viewport ${className}`}>
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
								<div key={getKey(item)}>{renderItem(item)}</div>
							))}
						</div>
					);
				})}
			</div>
		</div>
	);
}
