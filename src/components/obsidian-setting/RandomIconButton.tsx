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
	 * 各设置页的写入姿态**互不相同**（CommunityPlugin 走 `updateSettingByPath`
	 * 逐字段；其余四页整 map 写入，因为键里可能含 `.`），所以这个组件不碰写入
	 * ——把五种路径抽象成一层配置会比现在更难读。这里只共用「取值 + 提示文案」。
	 */
	onPick: (icon: string, type: IconType) => void | Promise<void>;
}

/**
 * 掷骰子按钮：在**当前图标所属的来源 / 分组**内随机换一个。
 *
 * tooltip 说出将在哪个范围内随机（`describeRandomScope`）——否则「为什么掷出来的
 * 还是这个包里的图标」无从理解。没有可掷时（池子空、或池子里只剩当前图标）
 * 什么都不写，也不弹 Notice：骰子是可以连点的轻动作，为它弹提示太吵。
 */
export const RandomIconButton: FC<RandomIconButtonProps> = ({
	value,
	type,
	onPick,
}) => {
	const settingsStore = useSettingsStore();
	const plugin = settingsStore.plugin;

	const current = iconRefOf(value, type);
	// 只查一次数组 + 已启用包的前缀，不枚举任何包的图标内容，渲染期调用是安全的
	const scope = resolveRandomScope(plugin, current);

	return (
		<ExtraButton
			icon="dices"
			tooltip={describeRandomScope(plugin, scope)}
			onClick={async () => {
				const picked = randomIconFor(plugin, current);
				if (!picked) {
					return;
				}
				await onPick(picked.id, picked.type);
			}}
		/>
	);
};
