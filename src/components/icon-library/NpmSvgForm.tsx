import { LL } from "@src/i18n/i18n";
import { InstallOptions } from "@src/service/icon-packs/IconPackService";
import { IconSourceConfig } from "@src/types/types";
import { useEffect, useState } from "react";

interface NpmSvgFormProps {
	onSubmit: (
		config: IconSourceConfig,
		options: InstallOptions,
	) => Promise<void>;
	onReady?: (submit: (() => Promise<void>) | null) => void;
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

	const isValid =
		/^[a-z][a-z0-9-]*$/.test(packId.trim().toLowerCase()) &&
		packageName.trim() !== "" &&
		glob.trim() !== "";

	const handleSubmit = async () => {
		if (!isValid) {
			return;
		}
		await onSubmit(
			{
				type: "npm-svg",
				package: packageName.trim(),
				version: version.trim(),
				glob: glob.trim(),
			},
			{
				packId: packId.trim().toLowerCase(),
			},
		);
	};

	useEffect(() => {
		onReady?.(isValid ? handleSubmit : null);
	}, [packId, packageName, glob, version]);

	return (
		<div className="ci-lib__form">
			<input
				className="ci-lib__form__input"
				type="text"
				placeholder={LL.view.CustomIconLib.pack.npmModal.packIdPlaceholder()}
				value={packId}
				onChange={(e) => setPackId(e.target.value)}
			/>
			<input
				className="ci-lib__form__input"
				type="text"
				placeholder={LL.view.CustomIconLib.pack.npmModal.packagePlaceholder()}
				value={packageName}
				onChange={(e) => setPackageName(e.target.value)}
			/>
			<input
				className="ci-lib__form__input"
				type="text"
				placeholder={LL.view.CustomIconLib.pack.npmModal.globPlaceholder()}
				value={glob}
				onChange={(e) => setGlob(e.target.value)}
			/>
			<input
				className="ci-lib__form__input"
				type="text"
				placeholder={LL.view.CustomIconLib.pack.npmModal.versionPlaceholder()}
				value={version}
				onChange={(e) => setVersion(e.target.value)}
			/>
			<div className="ci-pack__confirm-hint">
				{LL.view.CustomIconLib.pack.npmModal.hint()}
			</div>
		</div>
	);
};
