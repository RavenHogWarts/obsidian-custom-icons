import useSettingsStore from "@src/hooks/useSettingsStore";
import { IconType } from "@src/types/types";
import { iconRefOf } from "@src/util/iconRef";
import {
	describeRandomScope,
	randomIconFor,
	resolveRandomScope,
} from "@src/util/randomIcon";
import { FC, useCallback, useRef } from "react";
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
}) => {
	const settingsStore = useSettingsStore();
	const plugin = settingsStore.plugin;

	const current = iconRefOf(value, type);
	// 只查一次数组 + 已启用包的前缀，不枚举任何包的图标内容，渲染期调用是安全的
	const scope = resolveRandomScope(plugin, current);

	/*
	 * 稳定回调 + 最新闭包（与 IconPickerModal 里 IconTile 的处理同一手法）。
	 *
	 * 必须这么写，不能图省事传内联箭头：`ExtraButton` 在 `[button, onClick]` 变化时
	 * 重新调 `button.onClick(handler)`，而**没有清理上一个**（见 Controls.tsx）。
	 * 内联箭头每次渲染都是新引用，于是处理器会随渲染次数累积。
	 *
	 * 别的按钮（重置 / 删除）幂等，叠几次看不出来；**骰子不幂等**——叠 N 个监听
	 * 就是一次点击掷 N 次、写 N 次盘、触发 N 次 applyAll，而每次写入又会让设置页
	 * 重渲、再叠一层，越点越糟。这里 deps 为空，因此只注册一次。
	 */
	const latest = useRef({ current, onPick, plugin });
	latest.current = { current, onPick, plugin };

	const handleClick = useCallback(async () => {
		const { current: ref, onPick: pick, plugin: p } = latest.current;
		const picked = randomIconFor(p, ref);
		// 无可掷（池子空，或池子里只剩当前图标）：什么都不写
		if (!picked) {
			return;
		}
		await pick(picked.id, picked.type);
	}, []);

	return (
		<ExtraButton
			icon="dices"
			tooltip={describeRandomScope(plugin, scope)}
			onClick={handleClick}
		/>
	);
};
