import { LL } from "@src/i18n/i18n";
import { IconType } from "@src/types/types";
import setIcon from "@src/util/setIcon";
import { Check, Pencil, Star } from "lucide-react";
import { Menu, Notice } from "obsidian";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import "./IconCard.css";

/** 「已复制」微反馈的显示时长（ms）。方案原写 180ms，太短来不及读，放宽到 1s */
const COPIED_FEEDBACK_MS = 1000;

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
	/**
	 * 额外动作（如「复制 SVG 源码」）。
	 * 只出现在右键菜单里——hover 浮层只留最高频的星标与编辑。
	 */
	customActions?: CustomAction[];
	/** 是否已收藏；与 onToggleFavorite 同时传入才显示星标 */
	favorite?: boolean;
	onToggleFavorite?: (id: string, type: IconType) => void;
}

// memo：虚拟网格滚动/搜索时跳过 props 未变卡片的重渲（含 setIcon DOM 副作用）
export const IconCard = memo(function IconCard({
	id,
	type = "svg",
	onDelete,
	onEdit,
	customActions = [],
	favorite,
	onToggleFavorite,
}: IconCardProps) {
	const iconRef = useRef<HTMLDivElement>(null);
	const timerRef = useRef<number | null>(null);
	const [copied, setCopied] = useState(false);
	const card = LL.view.CustomIconLib.card;

	// hover 浮层只留星标与编辑：删除、复制 SVG 源码等下沉到右键菜单，
	// 既降低视觉噪音，也让卡片在紧凑密度下放得下
	const hasActions = Boolean(onEdit || onToggleFavorite);

	useEffect(() => {
		if (iconRef.current) {
			try {
				setIcon(iconRef.current, type, id);
			} catch (e) {
				console.error("Failed to render icon", id, e);
			}
		}
	}, [id, type]);

	useEffect(
		() => () => {
			if (timerRef.current !== null) {
				window.clearTimeout(timerRef.current);
			}
		},
		[],
	);

	/** 复制成功走卡片内 ✓ 微反馈；Notice 只留给失败 */
	const copy = useCallback(
		async (text: string, failedMessage: string) => {
			try {
				await navigator.clipboard.writeText(text);
				setCopied(true);
				if (timerRef.current !== null) {
					window.clearTimeout(timerRef.current);
				}
				timerRef.current = window.setTimeout(
					() => setCopied(false),
					COPIED_FEEDBACK_MS,
				);
			} catch (err) {
				console.error("Failed to copy to clipboard:", err);
				new Notice(failedMessage);
			}
		},
		[],
	);

	const copyName = useCallback(() => {
		void copy(id, card.copyNameFailed());
	}, [copy, id, card]);

	// 用户导入的 SVG 存的是裸 id，实际注册 id 带 CI- 前缀；
	// 包图标的 id 本身已是 CI-{packId}-{name}，lucide 的名字即 id
	const fullId =
		type === "svg" && !id.startsWith("CI-") ? `CI-${id}` : null;

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		const menu = new Menu();

		menu.addItem((item) =>
			item
				.setTitle(card.copyName())
				.setIcon("clipboard-copy")
				.onClick(copyName),
		);

		if (fullId) {
			menu.addItem((item) =>
				item
					.setTitle(card.copyFullId())
					.setIcon("clipboard-list")
					.onClick(() =>
						void copy(fullId, card.copyNameFailed()),
					),
			);
		}

		for (const action of customActions) {
			menu.addItem((item) =>
				item
					.setTitle(action.title)
					.setIcon("code")
					.onClick(() => void action.onClick(id)),
			);
		}

		if (onToggleFavorite) {
			menu.addItem((item) =>
				item
					.setTitle(
						favorite
							? LL.view.CustomIconLib.picker.favoriteRemove()
							: LL.view.CustomIconLib.picker.favoriteAdd(),
					)
					.setIcon("star")
					.onClick(() => onToggleFavorite(id, type)),
			);
		}

		if (onEdit) {
			menu.addItem((item) =>
				item
					.setTitle(LL.common.edit())
					.setIcon("pencil")
					.onClick(() => void onEdit(id)),
			);
		}

		if (onDelete) {
			menu.addItem((item) =>
				item
					.setTitle(LL.common.delete())
					.setIcon("trash-2")
					.onClick(() => onDelete(id)),
			);
		}

		menu.showAtMouseEvent(e.nativeEvent);
	};

	return (
		<div
			className={`ci-lib-icon__card${hasActions ? "" : " ci-lib-icon__card--readonly"}${copied ? " is-copied" : ""}`}
			onContextMenu={handleContextMenu}
		>
			{hasActions && (
				<div className="ci-lib-icon__card-actions">
					{onToggleFavorite && (
						<button
							className={`ci-lib-icon__card-action ci-lib-icon__card-star clickable-icon${favorite ? " is-on" : ""}`}
							onClick={(e) => {
								e.stopPropagation();
								onToggleFavorite(id, type);
							}}
							aria-label={
								favorite
									? LL.view.CustomIconLib.picker.favoriteRemove()
									: LL.view.CustomIconLib.picker.favoriteAdd()
							}
						>
							<Star className="svg-icon" />
						</button>
					)}

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
				</div>
			)}

			{/* 复制成功的瞬时反馈，取代原来每次都弹的系统 Notice */}
			{copied && (
				<span className="ci-lib-icon__card-copied" aria-hidden="true">
					<Check className="svg-icon" />
				</span>
			)}

			<div
				ref={iconRef}
				className="ci-lib-icon__card-icon clickable-icon"
				onClick={copyName}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						copyName();
					}
				}}
				title={card.copyNameTooltip()}
				role="button"
				tabIndex={0}
				aria-label={id}
			></div>
			<button
				className="ci-lib-icon__card-name clickable-icon"
				onClick={copyName}
				title={id}
				aria-label={id}
			>
				{id}
			</button>
		</div>
	);
});
