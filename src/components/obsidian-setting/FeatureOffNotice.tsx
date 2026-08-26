import { LL } from "@src/i18n/i18n";
import { FC } from "react";
import { SettingItem } from "./SettingItem";

export interface FeatureOffNoticeProps {
	/** 功能总开关的当前值 */
	enabled: boolean;
}

/**
 * 「功能已关闭，下面的配置不生效」提示行。
 *
 * 为什么需要它：`SettingGroup disabled` 只做到了「看起来不能动」，而「为什么」
 * 必须说出来。灰掉而不解释，用户的第一反应是插件坏了，而不是「哦上面那个开关没开」。
 *
 * 放在总开关**下面一行**、且自己不跟着灰：它是那片灰里唯一要被读到的东西。
 * 开关打开时整行消失，不占位置。
 */
export const FeatureOffNotice: FC<FeatureOffNoticeProps> = ({ enabled }) => {
	if (enabled) {
		return null;
	}
	return (
		<SettingItem
			className="ci-setting-notice"
			name={LL.common.featureOff.name()}
			desc={LL.common.featureOff.desc()}
		/>
	);
};
