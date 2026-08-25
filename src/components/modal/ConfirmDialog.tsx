import { LL } from "@src/i18n/i18n";
import CIPlugin from "@src/main";
import { useState } from "react";
import { BaseModal, BaseModalOptions } from "./BaseModal";
import "./ConfirmDialog.css";

interface ConfirmDialogProps {
	title: string;
	confirmLL: string;
	children?: React.ReactNode;
	/**
	 * 确认动作。
	 *
	 * 返回 `false` = 校验未通过或什么都没做，**弹窗保持打开**——由内容自行就地说明原因；
	 * 返回其它值（含 `undefined`）= 视为成功并关闭。
	 *
	 * 这条契约替代了原来的「无条件关闭」：表单 early-return 不再表现为
	 * 「点了就关、啥也没发生」。
	 */
	onConfirm: () => void | boolean | Promise<void | boolean>;
	disableConfirm?: boolean;
}

export interface ConfirmDialogViewProps extends ConfirmDialogProps {
	plugin: CIPlugin;
	onClose: () => void;
}

const ConfirmDialogView: React.FC<ConfirmDialogViewProps> = ({
	children,
	confirmLL,
	onConfirm,
	onClose,
	disableConfirm,
}) => {
	// 提交中：兼作防重复点击（下载/写盘期间可能持续数秒）
	const [busy, setBusy] = useState(false);

	const handleConfirm = async () => {
		if (busy) {
			return;
		}
		setBusy(true);
		try {
			const result = await onConfirm();
			if (result === false) {
				setBusy(false); // 保持打开：解除忙态，让用户改完再试
				return;
			}
		} catch (error) {
			console.error("Confirm action failed:", error);
			setBusy(false);
			return;
		}
		// 成功后不再 setState：onClose 会卸载整棵树
		onClose();
	};

	return (
		<div className="ci-confirm-dialog">
			<div className="ci-confirm-dialog__content">{children}</div>
			<div className="ci-confirm-dialog__actions">
				<button
					className="mod-cta"
					onClick={() => {
						void handleConfirm();
					}}
					disabled={disableConfirm || busy}
				>
					{confirmLL}
				</button>
				<button onClick={onClose} disabled={busy}>
					{LL.common.cancel()}
				</button>
			</div>
		</div>
	);
};

export class ConfirmDialog extends BaseModal<ConfirmDialogViewProps> {
	constructor(
		plugin: CIPlugin,
		props: ConfirmDialogProps,
		options?: BaseModalOptions,
	) {
		const viewProps = {
			...props,
			plugin,
		};

		super(plugin, ConfirmDialogView, viewProps, "", options);
	}
}
