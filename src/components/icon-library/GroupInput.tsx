import { LL } from "@src/i18n/i18n";
import { GROUP_NAME_MAX } from "@src/util/svgGroups";
import { useId } from "react";

interface GroupInputProps {
	/** 已存在的组名，作为 datalist 候选 */
	groups: string[];
	value: string;
	onChange: (next: string) => void;
	/** 输入框下方的说明（添加与导入的语义不同，由调用方给） */
	hint?: string;
}

/**
 * 组名输入：可选已有分组，也可直接敲一个新名字。
 *
 * 用原生 `<input list>` + `<datalist>` 而不是自造下拉：这里要的正是「既能选已有、
 * 又能新建」，而原生 datalist 天然就是这个语义——不必自己处理键盘走位、失焦收起、
 * 候选过滤，也不会与 Obsidian 弹窗的焦点管理打架。
 *
 * datalist 的意义不只是省打字：组名**区分大小写**（`Weather` 与 `weather` 是两个组），
 * 把已有组名摆在眼前是避免手滑造出近似组的主要手段。
 */
export const GroupInput: React.FC<GroupInputProps> = ({
	groups,
	value,
	onChange,
	hint,
}) => {
	// 同一弹窗里可能出现多个实例（AddSvg 三个模式各一个），id 必须唯一
	const listId = useId();
	const groupLL = LL.view.CustomIconLib.svg.group;

	// 标签与输入框同一行，说明另起一行：`.ci-lib__form-row` 是居中的横向 flex，
	// 说明塞进去会挤在输入框右侧。两处调用方都把本组件放在纵向的 `.ci-lib__form` 里，
	// 所以返回 fragment 即可让说明成为它的下一个 flex item
	return (
		<>
			<div className="ci-lib__form-row ci-lib__form-row--field">
				<span className="ci-lib__form-label">{groupLL.label()}</span>
				<input
					className="ci-lib__form__input"
					type="text"
					list={groups.length > 0 ? listId : undefined}
					maxLength={GROUP_NAME_MAX}
					placeholder={groupLL.placeholder()}
					value={value}
					onChange={(e) => onChange(e.target.value)}
				/>
				{groups.length > 0 && (
					<datalist id={listId}>
						{groups.map((name) => (
							<option key={name} value={name} />
						))}
					</datalist>
				)}
			</div>
			{hint && <span className="ci-lib__form-hint">{hint}</span>}
		</>
	);
};
