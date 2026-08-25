import { LL } from "@src/i18n/i18n";
import { validateSvgContent } from "@src/service/icon-packs/sanitize";
import { useEffect, useMemo, useState } from "react";
import { SvgGlyph } from "./SvgGlyph";

interface EditSvgProps {
	iconId: string;
	iconContent: string;
	/** 其它图标已占用的 ID（**不含**当前图标自身），用于改名时的重名检测 */
	existingIds: string[];
	/** 返回 false = 目标图标已不存在，未写入 */
	onSubmit: (iconId: string, iconContent: string) => Promise<boolean>;
	/** submit 返回 false = 校验未通过，ConfirmDialog 应保持弹窗打开 */
	onReady?: (submit: () => Promise<boolean>) => void;
}

export const EditSvg: React.FC<EditSvgProps> = ({
	iconId: initialIconId,
	iconContent: initialIconContent,
	existingIds,
	onSubmit,
	onReady,
}) => {
	const [iconId, setIconId] = useState(initialIconId);
	const [iconContent, setIconContent] = useState(initialIconContent);
	const [error, setError] = useState<string | null>(null);

	const modal = LL.view.CustomIconLib.svg.modal;
	const existing = useMemo(() => new Set(existingIds), [existingIds]);

	const trimmedId = iconId.trim();
	const trimmedContent = iconContent.trim();
	const duplicate = trimmedId !== "" && existing.has(trimmedId);
	const preview = useMemo(
		() => (trimmedContent ? validateSvgContent(trimmedContent) : null),
		[trimmedContent],
	);
	const invalid = trimmedContent !== "" && preview === null;

	const handleSubmit = async (): Promise<boolean> => {
		setError(null);
		if (!trimmedId) {
			setError(modal.idRequired());
			return false;
		}
		if (!trimmedContent) {
			setError(modal.contentRequired());
			return false;
		}
		if (preview === null) {
			setError(modal.invalidSvg());
			return false;
		}
		if (duplicate) {
			setError(modal.duplicateId({ id: trimmedId }));
			return false;
		}
		if (!(await onSubmit(trimmedId, trimmedContent))) {
			setError(modal.targetMissing());
			return false;
		}
		return true;
	};

	// 每次渲染都重新登记，保证 ConfirmDialog 拿到的是最新闭包
	useEffect(() => {
		onReady?.(handleSubmit);
	});

	return (
		<div className="ci-lib__form">
			<input
				className={`ci-lib__form__input${duplicate ? " is-invalid" : ""}`}
				type="text"
				placeholder={modal.idPlaceholder()}
				value={iconId}
				onChange={(e) => setIconId(e.target.value)}
			/>
			{duplicate && (
				<div className="ci-lib__form-error">
					{modal.duplicateId({ id: trimmedId })}
				</div>
			)}
			<textarea
				className={`ci-lib__form__textarea${invalid ? " is-invalid" : ""}`}
				placeholder={modal.contentPlaceholder()}
				rows={10}
				value={iconContent}
				onChange={(e) => setIconContent(e.target.value)}
			/>
			{invalid && (
				<div className="ci-lib__form-error">{modal.invalidSvg()}</div>
			)}
			{preview && (
				<div className="ci-lib__form-preview">
					<span className="ci-lib__form-label">
						{modal.previewTitle()}
					</span>
					<SvgGlyph
						svg={preview}
						className="ci-lib__form-preview-glyph"
						label={trimmedId || modal.previewTitle()}
					/>
				</div>
			)}
			{error && <div className="ci-lib__form-error">{error}</div>}
		</div>
	);
};
