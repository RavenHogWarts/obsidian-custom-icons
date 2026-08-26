import { GroupInput } from "@src/components/icon-library/GroupInput";
import { LL } from "@src/i18n/i18n";
import { normalizeGroupName } from "@src/util/groupName";
import { useEffect, useState } from "react";

interface MoveExtGroupProps {
	/** 已存在的组名（datalist 候选） */
	groups: string[];
	/** 要移动的扩展名条数，用于说明文案 */
	count: number;
	/** 输入框初值（单条走「移到分组…」时预填它当前的组） */
	initial?: string;
	/** 提交：`""` = 移出分组 */
	onSubmit: (group: string) => Promise<void>;
	/** 每次渲染登记最新闭包，供 ConfirmDialog 的 onConfirm 调用 */
	onReady?: (submit: () => Promise<boolean>) => void;
}

/**
 * 「把扩展名移到分组」弹窗内容。
 *
 * 与 SVG 库的 `MoveToGroup` 逐行同构，只有文案取自 `settings.fileExplorer.extGroup`：
 * 两处的分组建模本就是同一套（组名挂在成员上），行为差异只在术语。
 * 留空即移出分组，所以没有单独的「移出」按钮。
 */
export const MoveExtGroup: React.FC<MoveExtGroupProps> = ({
	groups,
	count,
	initial = "",
	onSubmit,
	onReady,
}) => {
	const [value, setValue] = useState(initial);
	const groupLL = LL.settings.fileExplorer.extGroup;

	const target = normalizeGroupName(value);
	// 目标组已存在且不是初值所在的组 = 与已有成员合并，提前说一声
	const merging =
		target !== "" && groups.includes(target) && target !== initial;

	// 每次渲染都重新登记，保证 ConfirmDialog 拿到的是最新闭包
	useEffect(() => {
		onReady?.(async () => {
			await onSubmit(target);
			return true;
		});
	});

	return (
		<div className="ci-lib__form">
			<span className="ci-lib__form-hint">
				{groupLL.moveCount({ count })}
			</span>
			<span className="ci-lib__form-hint">{groupLL.moveHint()}</span>
			<GroupInput
				groups={groups}
				value={value}
				onChange={setValue}
				label={groupLL.label()}
				placeholder={groupLL.placeholder()}
				hint={target === "" ? groupLL.moveOutHint() : undefined}
			/>
			{merging && (
				<div className="ci-lib__form-warning">
					{groupLL.mergeWarning({ group: target })}
				</div>
			)}
		</div>
	);
};
