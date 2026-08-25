import { LL } from "@src/i18n/i18n";

export interface EmptyStateAction {
	label: string;
	/** 收到触发元素的事件：跨 popout 窗口场景需要它来决定弹窗挂载到哪个 document */
	onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
	/** 主行动（accent 按钮），一屏最多一个 */
	cta?: boolean;
}

interface LibEmptyStateProps {
	/** 可选装饰图标 */
	icon?: React.ReactNode;
	title: string;
	desc?: string;
	/** 出路：至少给一个，避免"空白页 + 没有下一步" */
	actions?: EmptyStateAction[];
}

/**
 * 图标库通用空态。
 *
 * 三种场景共用：空库（引导添加）、搜索无结果（清空 / 换页去搜）、筛选无结果（放宽筛选）。
 * 设计约束：**永远给出至少一个可点的下一步**——纯文案的空白页是本次改造要消灭的对象。
 */
export const LibEmptyState: React.FC<LibEmptyStateProps> = ({
	icon,
	title,
	desc,
	actions = [],
}) => (
	<div className="ci-lib__empty">
		{icon && <div className="ci-lib__empty-icon">{icon}</div>}
		<div className="ci-lib__empty-title">{title}</div>
		{desc && <div className="ci-lib__empty-desc">{desc}</div>}
		{actions.length > 0 && (
			<div className="ci-lib__empty-actions">
				{actions.map((action) => (
					<button
						key={action.label}
						className={action.cta ? "mod-cta" : undefined}
						onClick={action.onClick}
					>
						{action.label}
					</button>
				))}
			</div>
		)}
	</div>
);

interface LibGridSkeletonProps {
	/** 占位块数量 */
	count?: number;
	/** 屏幕阅读器提示（如"正在读取图标库…"） */
	label?: string;
}

/**
 * 网格加载骨架：读包 / 首屏计算期间替代空白，让"正在加载"和"什么都没有"可区分。
 */
export const LibGridSkeleton: React.FC<LibGridSkeletonProps> = ({
	count = 24,
	label = LL.view.CustomIconLib.pack.detailLoading(),
}) => (
	<div className="ci-lib__skeleton" aria-busy="true" aria-label={label}>
		{Array.from({ length: count }, (_, index) => (
			<div key={index} className="ci-lib__skeleton-tile" />
		))}
	</div>
);
