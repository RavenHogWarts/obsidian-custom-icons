import useSettingsStore from "@src/hooks/useSettingsStore";
import { IconType } from "@src/types/types";
import { iconRefOf } from "@src/util/iconRef";
import {
	describeRandomScope,
	randomIconFor,
	resolveRandomScope,
} from "@src/util/randomIcon";
import { FC } from "react";
import { ExtraButton } from "./Controls";

export interface RandomIconButtonProps {
	/** 当前生效的图标（决定随机域）；未配置图标的行传 `icon: ""` 即可 */
	value: string;
	type: IconType;
	/**
	 * 掷出结果后的写入。
	 *
	 * 各设置页的写入姿态**互不相同**（键里可能含 `.`，五页各有自己的整 map /
	 * 逐字段路径），所以这个组件不碰写入——把五种路径抽象成一层配置会比现在
	 * 更难读。这里只共用「取值 + 提示文案」。
	 *
	 * 调用方**一次写完 icon 与 type**：分两次写不仅是两遍 `saveSettings` +
	 * `applyAll`，中间那一拍还是「新 icon 配旧 type」的错配状态。
	 */
	onPick: (icon: string, type: IconType) => void | Promise<void>;

	/**
	 * 附加在 tooltip 前面的一句说明，用来交代**这一下会动多少行**。
	 *
	 * 分组行上的骰子是「给整组掷同一个」，成员行上的是「只掷这一行」——同一页面、
	 * 同一个图标、两种行为。默认单行是符合直觉的那种，所以只有反直觉的那处需要说。
	 */
	note?: string;
}

/**
 * 掷骰子按钮：在**当前图标所属的来源段**内随机换一个
 * （Lucide / 我的 SVG / 某个图标包，与图标选择器的分段一一对应）。
 *
 * tooltip 说出将在哪个范围内随机（`describeRandomScope`）——否则「为什么掷出来的
 * 还是这个包里的图标」无从理解。没有可掷时（池子空、或池子里只剩当前图标）
 * 什么都不写，也不弹 Notice：骰子是可以连点的轻动作，为它弹提示太吵。
 */
export const RandomIconButton: FC<RandomIconButtonProps> = ({
	value,
	type,
	onPick,
	note,
}) => {
	const settingsStore = useSettingsStore();
	const plugin = settingsStore.plugin;

	const current = iconRefOf(value, type);
	// 只查一次数组 + 已启用包的前缀，不枚举任何包的图标内容，渲染期调用是安全的
	const scope = resolveRandomScope(plugin, current);
	const scopeText = describeRandomScope(plugin, scope);

	return (
		<ExtraButton
			icon="dices"
			tooltip={note ? `${note} · ${scopeText}` : scopeText}
			onClick={async () => {
				const picked = randomIconFor(plugin, current);
				// 无可掷（池子空，或池子里只剩当前图标）：什么都不写
				if (!picked) {
					return;
				}
				await onPick(picked.id, picked.type);
			}}
		/>
	);
};
