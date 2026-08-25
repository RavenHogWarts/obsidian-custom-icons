import { LL } from "@src/i18n/i18n";
import { normalizeGroupName } from "@src/util/svgGroups";
import { useEffect, useState } from "react";
import { GroupInput } from "./GroupInput";

interface RenameGroupProps {
	/** 被重命名的组 */
	group: string;
	/** 组内图标数，用于说明文案 */
	count: number;
	/** 已存在的组名（datalist 候选，含自身） */
	groups: string[];
	onSubmit: (next: string) => Promise<void>;
	/** 每次渲染登记最新闭包，供 ConfirmDialog 的 onConfirm 调用 */
	onReady?: (submit: () => Promise<boolean>) => void;
}

/**
 * 「重命名分组」弹窗内容。
 *
 * 与「移到分组」的关键差别是**留空不再等于移出**：那里清空输入框是一个合理动作
 * （把选中的图标移出分组），这里清空意味着「把整组解散」——一个破坏性得多、
 * 且右键菜单里已有专门入口的动作。留空时就地报错并指向那个入口，
 * 而不是顺手替用户解散掉整个组。
 */
export const RenameGroup: React.FC<RenameGroupProps> = ({
	group,
	count,
	groups,
	onSubmit,
	onReady,
}) => {
	const [value, setValue] = useState(group);
	const [showEmptyError, setShowEmptyError] = useState(false);
	const groupLL = LL.view.CustomIconLib.svg.group;

	const target = normalizeGroupName(value);
	// 改成另一个已存在的组名 = 两组合并，提前说一声（renameGroup 天然支持）
	const merging = target !== "" && target !== group && groups.includes(target);

	// 每次渲染都重新登记，保证 ConfirmDialog 拿到的是最新闭包（与 AddSvg 同一套路）
	useEffect(() => {
		onReady?.(async () => {
			if (!target) {
				// 返回 false = 弹窗保持打开，由上面的错误行解释原因
				setShowEmptyError(true);
				return false;
			}
			// 没改名就当取消：不写盘、也不弹「已改名为它自己」这种废话通知
			if (target !== group) {
				await onSubmit(target);
			}
			return true;
		});
	});

	return (
		<div className="ci-lib__form">
			<span className="ci-lib__form-hint">
				{groupLL.renameCount({ count })}
			</span>
			<GroupInput
				groups={groups}
				value={value}
				onChange={(next) => {
					setValue(next);
					// 一开始打字就把错误收掉，别让红字挂在那儿碍眼
					setShowEmptyError(false);
				}}
			/>
			{showEmptyError && (
				<div className="ci-lib__form-error">{groupLL.renameEmpty()}</div>
			)}
			{merging && (
				<div className="ci-lib__form-warning">
					{groupLL.mergeWarning({ group: target })}
				</div>
			)}
		</div>
	);
};
