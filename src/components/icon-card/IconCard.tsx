import { LL } from "@src/i18n/i18n";
import { IconType } from "@src/types/types";
import setIcon from "@src/util/setIcon";
import { Pencil, Trash2 } from "lucide-react";
import { Notice } from "obsidian";
import { useEffect, useRef } from "react";
import "./IconCard.css";

export interface CustomAction {
	icon: React.ReactNode;
	title: string;
	onClick: (id: string) => void | Promise<void>;
}

interface IconCardProps {
	id: string;
	/** 图标类型，默认 "svg"；lucide 只读页传 "lucide" */
	type?: IconType;
	onDelete?: (id: string) => void;
	onEdit?: (id: string) => void | Promise<void>;
	customActions?: CustomAction[];
}

export const IconCard: React.FC<IconCardProps> = ({
	id,
	type = "svg",
	onDelete,
	onEdit,
	customActions = [],
}) => {
	const iconRef = useRef<HTMLDivElement>(null);

	// 只读卡片：不传任何操作回调时无操作按钮
	const hasActions = Boolean(onEdit || onDelete || customActions.length > 0);

	useEffect(() => {
		if (iconRef.current) {
			try {
				setIcon(iconRef.current, type, id);
			} catch (e) {
				console.error("Failed to render icon", id, e);
			}
		}
	}, [id, type]);

	const handleCopyName = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			await navigator.clipboard.writeText(id);
			new Notice(`Copied: ${id}`);
		} catch (err) {
			console.error("Failed to copy icon name:", err);
			new Notice("Failed to copy icon name");
		}
	};

	return (
		<div
			className={
				hasActions
					? "ci-lib-icon__card"
					: "ci-lib-icon__card ci-lib-icon__card--readonly"
			}
		>
			{/* 操作按钮组 */}
			{hasActions && (
				<div className="ci-lib-icon__card-actions">
					{onEdit && (
						<button
							className="ci-lib-icon__card-action ci-lib-icon__card-edit clickable-icon"
							onClick={(e) => {
								e.stopPropagation();
								void onEdit(id);
							}}
							aria-label={LL.common.edit()}
						>
							<Pencil className="svg-icon" />
						</button>
					)}

					{customActions.map((action, index) => (
						<button
							key={index}
							className="ci-lib-icon__card-action ci-lib-icon__card-custom clickable-icon"
							onClick={(e) => {
								e.stopPropagation();
								void action.onClick(id);
							}}
							aria-label={action.title}
						>
							{action.icon}
						</button>
					))}

					{onDelete && (
						<button
							className="ci-lib-icon__card-action ci-lib-icon__card-delete clickable-icon"
							onClick={(e) => {
								e.stopPropagation();
								onDelete(id);
							}}
							aria-label={LL.common.delete()}
						>
							<Trash2 className="svg-icon" />
						</button>
					)}
				</div>
			)}

			<div
				ref={iconRef}
				className="ci-lib-icon__card-icon clickable-icon"
				onClick={(e) => {
					void handleCopyName(e);
				}}
				title="Click to copy icon name"
				role="button"
				aria-label={id}
			></div>
			<button
				className="ci-lib-icon__card-name clickable-icon"
				onClick={(e) => {
					void handleCopyName(e);
				}}
				title="Click to copy icon name"
				aria-label={id}
			>
				{id}
			</button>
		</div>
	);
};
