import { LL } from "@src/i18n/i18n";
import CIPlugin from "@src/main";
import { BaseModal } from "./BaseModal";
import "./ConfirmDialog.css";

interface ConfirmDialogProps {
	title: string;
	confirmLL: string;
	children?: React.ReactNode;
	onConfirm: () => void | Promise<void>;
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
	const handleConfirm = async () => {
		await onConfirm();
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
					disabled={disableConfirm}
				>
					{confirmLL}
				</button>
				<button onClick={onClose}>{LL.common.cancel()}</button>
			</div>
		</div>
	);
};

export class ConfirmDialog extends BaseModal<ConfirmDialogViewProps> {
	constructor(plugin: CIPlugin, props: ConfirmDialogProps) {
		const viewProps = {
			...props,
			plugin,
		};

		super(plugin, ConfirmDialogView, viewProps, "");
	}
}
