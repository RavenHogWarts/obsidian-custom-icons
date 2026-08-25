import { useStripAutoScroll } from "@src/hooks/useStripAutoScroll";
import { LL } from "@src/i18n/i18n";
import {
	SvgGroupFilter,
	SvgGroupInfo,
	UNGROUPED,
} from "@src/util/svgGroups";

interface GroupStripProps {
	/** 当前存在的分组（`listSvgGroups` 的结果，已按名称序） */
	groups: SvgGroupInfo[];
	/** 未分组图标数；为 0 时不显示「未分组」档 */
	ungroupedCount: number;
	/** 全部图标数（「全部」档的计数） */
	totalCount: number;
	value: SvgGroupFilter;
	onChange: (next: SvgGroupFilter) => void;
	/**
	 * 右键某个**真实分组**（不含「全部」/「未分组」）时调用，用于开管理菜单。
	 * 事件透传出去是因为菜单要在鼠标处弹出。
	 */
	onGroupMenu?: (group: string, event: React.MouseEvent) => void;
}

/** 每个档的 DOM key / 定位键：`null` 与 `""` 都不是合法 key，编码一下 */
const keyOf = (filter: SvgGroupFilter): string =>
	filter === null ? "\0all" : filter === UNGROUPED ? "\0none" : filter;

/**
 * 「我的 SVG」页的分组筛选行。
 *
 * **一个分组都没有时整行不渲染**（调用方判断）：只剩「全部」一档等于没有信息量，
 * 白占一行高度。「未分组」档同理，未分组图标数为 0 时不出现——点进去必然空空如也。
 *
 * 形态与图标选择器的分段行一致，共用 `.ci-strip` + `useStripAutoScroll`：
 * 组多了自动横滚、当前项自动对位、被遮住的一侧画淡出边缘，全部白拿。
 *
 * 改名 / 删除挂在真实分组 tab 的右键菜单上——工具栏已有六个按钮，再加两个
 * 只对「当前正好选中某个组」有意义的按钮，反而更难看懂。tab 是 `<button>`，
 * 因此键盘的菜单键 / Shift+F10 也能唤出同一个菜单，白拿一条无障碍路径。
 */
export const GroupStrip: React.FC<GroupStripProps> = ({
	groups,
	ungroupedCount,
	totalCount,
	value,
	onChange,
	onGroupMenu,
}) => {
	const groupLL = LL.view.CustomIconLib.svg.group;
	const stripRef = useStripAutoScroll<HTMLDivElement>(keyOf(value));

	const tabs: Array<{ filter: SvgGroupFilter; label: string; count: number }> =
		[
			{ filter: null, label: groupLL.all(), count: totalCount },
			...groups.map((group) => ({
				filter: group.name,
				label: group.name,
				count: group.count,
			})),
			// 未分组排在末位：有名字的套才是用户主动关心的，这一档是收容所
			...(ungroupedCount > 0
				? [
						{
							filter: UNGROUPED,
							label: groupLL.ungrouped(),
							count: ungroupedCount,
						},
					]
				: []),
		];

	return (
		<div
			ref={stripRef}
			className="ci-strip ci-lib__gstrip"
			role="tablist"
			aria-label={groupLL.stripLabel()}
		>
			{tabs.map((tab) => {
				const active = tab.filter === value;
				// 「全部」与「未分组」不是真实分组，没有可管理的东西
				const manageable =
					onGroupMenu !== undefined &&
					tab.filter !== null &&
					tab.filter !== UNGROUPED;
				return (
					<button
						key={keyOf(tab.filter)}
						role="tab"
						aria-selected={active}
						className={`ci-lib__gstrip-tab${active ? " is-active" : ""}`}
						onClick={() => onChange(tab.filter)}
						onContextMenu={
							manageable
								? (e) => onGroupMenu(tab.filter as string, e)
								: undefined
						}
					>
						<span className="ci-lib__gstrip-label">{tab.label}</span>
						<span className="ci-lib__gstrip-count">{tab.count}</span>
					</button>
				);
			})}
		</div>
	);
};
