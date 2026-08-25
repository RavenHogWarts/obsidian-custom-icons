import { LL } from "@src/i18n/i18n";
import { normalizeGroupName } from "@src/util/svgGroups";
import { useEffect, useState } from "react";
import { GroupInput } from "./GroupInput";

interface MoveToGroupProps {
	/** 已存在的组名（datalist 候选） */
	groups: string[];
	/** 要移动的图标数，用于说明文案 */
	count: number;
	/** 输入框初值（单个图标走右键菜单时预填它当前的组） */
	initial?: string;
	/** 提交：`""` = 移出分组 */
	onSubmit: (group: string) => Promise<void>;
	/** 每次渲染登记最新闭包，供 ConfirmDialog 的 onConfirm 调用 */
	onReady?: (submit: () => Promise<boolean>) => void;
}

/**
 * 「移到分组」弹窗内容。
 *
 * 留空即移出分组，所以没有单独的「移出」按钮——清空输入框就是移出，
 * 少一个控件、少一处要解释的语义，文案负责把这件事说清。
 */
export const MoveToGroup: React.FC<MoveToGroupProps> = ({
	groups,
	count,
	initial = "",
	onSubmit,
	onReady,
}) => {
	const [value, setValue] = useState(initial);
	const groupLL = LL.view.CustomIconLib.svg.group;

	const target = normalizeGroupName(value);
	// 目标组已存在且不是初值所在的组 = 与已有成员合并，提前说一声
	const merging =
		target !== "" && groups.includes(target) && target !== initial;

	// 每次渲染都重新登记，保证 ConfirmDialog 拿到的是最新闭包（与 AddSvg 同一套路）
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
			<GroupInput
				groups={groups}
				value={value}
				onChange={setValue}
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
