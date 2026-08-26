import { LL } from "@src/i18n/i18n";
import {
	FILE_EXPLORER_PRESETS,
	PresetId,
} from "@src/util/fileExplorerPresets";
import { useEffect, useState } from "react";

interface PresetPickerProps {
	/** 已存在的组名：用于就地提示「这个预设会并入已有分组」 */
	groups: string[];
	/** 预设组名（按当前语言取），用于判断是否与已有组重名 */
	nameOf: (id: PresetId) => string;
	/** 每个预设将新建的扩展名条数，用于说明文案 */
	countOf: (id: PresetId) => number;
	onSubmit: (ids: PresetId[]) => Promise<void>;
	/** 每次渲染登记最新闭包，供 ConfirmDialog 的 onConfirm 调用 */
	onReady?: (submit: () => Promise<boolean>) => void;
}

/**
 * 「从预设创建分组」弹窗内容：勾选若干预设，一次创建。
 *
 * 复选而不是单选，因为一次配好「图片 / 视频 / 音频」是最常见的开场动作，
 * 逐个走三遍弹窗只是把同一件事切成三份。
 *
 * 每行都写清它会新增多少条、是否会并入已有同名分组——预设的整个价值在于省去
 * 手打二十个扩展名，但代价是用户不清楚它到底动了什么，所以这里必须先说明白。
 */
export const PresetPicker: React.FC<PresetPickerProps> = ({
	groups,
	nameOf,
	countOf,
	onSubmit,
	onReady,
}) => {
	const [selected, setSelected] = useState<Set<PresetId>>(new Set());
	const [showEmptyError, setShowEmptyError] = useState(false);
	const groupLL = LL.settings.fileExplorer.extGroup;

	const toggle = (id: PresetId) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
		// 一勾上就把错误收掉，别让红字挂在那儿碍眼
		setShowEmptyError(false);
	};

	// 每次渲染都重新登记，保证 ConfirmDialog 拿到的是最新闭包
	useEffect(() => {
		onReady?.(async () => {
			if (selected.size === 0) {
				// 返回 false = 弹窗保持打开，由下面的错误行解释原因
				setShowEmptyError(true);
				return false;
			}
			// 按 FILE_EXPLORER_PRESETS 的顺序提交，不按勾选顺序：通知里的组名顺序
			// 因此是稳定的，与列表所见一致
			await onSubmit(
				FILE_EXPLORER_PRESETS.filter((p) => selected.has(p.id)).map(
					(p) => p.id,
				),
			);
			return true;
		});
	});

	return (
		<div className="ci-lib__form">
			<span className="ci-lib__form-hint">{groupLL.presetHint()}</span>
			<div className="ci-fe__preset-list">
				{FILE_EXPLORER_PRESETS.map((preset) => {
					const name = nameOf(preset.id);
					const count = countOf(preset.id);
					const existing = groups.includes(name);
					return (
						<label key={preset.id} className="ci-fe__preset">
							<input
								type="checkbox"
								checked={selected.has(preset.id)}
								onChange={() => toggle(preset.id)}
							/>
							<span className="ci-fe__preset-name">{name}</span>
							<span className="ci-lib__form-hint">
								{groupLL.presetCount({
									count,
									total: preset.extensions.length,
								})}
							</span>
							{existing && (
								<span className="ci-lib__form-warning">
									{groupLL.presetExisting({ group: name })}
								</span>
							)}
						</label>
					);
				})}
			</div>
			{showEmptyError && (
				<div className="ci-lib__form-error">{groupLL.presetEmpty()}</div>
			)}
		</div>
	);
};
