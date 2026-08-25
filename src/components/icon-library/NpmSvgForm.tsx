import { LL } from "@src/i18n/i18n";
import { InstallOptions } from "@src/service/icon-packs/IconPackService";
import { validatePackId } from "@src/service/icon-packs/types";
import { IconSourceConfig } from "@src/types/types";
import { useEffect, useState } from "react";

interface NpmSvgFormProps {
	onSubmit: (
		config: IconSourceConfig,
		options: InstallOptions,
	) => Promise<void>;
	/** submit 返回 false = 校验未通过，ConfirmDialog 应保持弹窗打开 */
	onReady?: (submit: () => Promise<boolean>) => void;
}

/**
 * 自定义 npm 散装 SVG 安装表单
 * 用户提供「包名 + 可选版本 + 路径 glob + 包 id」，从 CDN 抓取散装 SVG
 */
export const NpmSvgForm: React.FC<NpmSvgFormProps> = ({
	onSubmit,
	onReady,
}) => {
	const [packId, setPackId] = useState("");
	const [packageName, setPackageName] = useState("");
	const [glob, setGlob] = useState("");
	const [version, setVersion] = useState("");
	const [submitted, setSubmitted] = useState(false);

	const npmModal = LL.view.CustomIconLib.pack.npmModal;

	// 与 IconPackService.install 使用同一个校验函数，避免"表单放过、安装才报错"
	const normalizedPackId = packId.trim().toLowerCase();
	const packIdProblem = normalizedPackId
		? validatePackId(normalizedPackId)
		: "invalid";
	const packIdError = packIdProblem
		? packIdProblem === "reserved"
			? npmModal.packIdReserved()
			: npmModal.packIdInvalid()
		: null;
	const packageError = packageName.trim() ? null : npmModal.packageRequired();
	const globError = glob.trim() ? null : npmModal.globRequired();

	// 未提交前不红一片：只在用户已经填过内容、或点过确认后才显示
	const show = (value: string, message: string | null) =>
		message && (submitted || value.trim() !== "") ? message : null;

	const handleSubmit = async (): Promise<boolean> => {
		setSubmitted(true);
		if (packIdError || packageError || globError) {
			return false;
		}
		await onSubmit(
			{
				type: "npm-svg",
				package: packageName.trim(),
				version: version.trim(),
				glob: glob.trim(),
			},
			{ packId: normalizedPackId },
		);
		return true;
	};

	// 每次渲染都重新登记，保证 ConfirmDialog 拿到的是最新闭包
	useEffect(() => {
		onReady?.(handleSubmit);
	});

	const field = (
		value: string,
		setValue: (next: string) => void,
		placeholder: string,
		message: string | null,
	) => {
		const visible = show(value, message);
		return (
			<>
				<input
					className={`ci-lib__form__input${visible ? " is-invalid" : ""}`}
					type="text"
					placeholder={placeholder}
					value={value}
					onChange={(e) => setValue(e.target.value)}
				/>
				{visible && (
					<div className="ci-lib__form-error">{visible}</div>
				)}
			</>
		);
	};

	return (
		<div className="ci-lib__form">
			{field(
				packId,
				setPackId,
				npmModal.packIdPlaceholder(),
				packIdError,
			)}
			{field(
				packageName,
				setPackageName,
				npmModal.packagePlaceholder(),
				packageError,
			)}
			{field(glob, setGlob, npmModal.globPlaceholder(), globError)}
			{field(version, setVersion, npmModal.versionPlaceholder(), null)}
			<div className="ci-pack__confirm-hint">{npmModal.hint()}</div>
		</div>
	);
};
