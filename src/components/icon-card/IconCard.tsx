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
	/**
	 * 右键菜单项的图标名（Obsidian 内置 lucide 名，如 `"code"`）。
	 *
	 * 是**名字**而不是 React 节点：这些动作只出现在 Obsidian 原生 `Menu` 里，
	 * 而 `MenuItem.setIcon` 只接受注册名——传节点进来会被静默忽略。
	 */
	icon?: string;
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
	/** 多选态描边（未传表示该页不支持多选） */
	selected?: boolean;
	/**
	 * 带修饰键的点击：Ctrl/Cmd 加选、Shift 连选。
	 * 无修饰键的普通点击仍然是「复制名称」——不因为进入选择状态就改变主动作。
	 */
	onModifierClick?: (
		id: string,
		mods: { toggle: boolean; range: boolean },
	) => void;
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
	selected,
	onModifierClick,
}: IconCardProps) {
	const iconRef = useRef<HTMLDivElement>(null);
	const timerRef = useRef<number | null>(null);
	const [copied, setCopied] = useState(false);
	const card = LL.view.CustomIconLib.card;

	// hover 浮层只留星标与编辑：删除、复制 SVG 源码等下沉到右键菜单，
	// 浮层悬浮在图块右上角，不占版面
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
	const copy = useCallback(async (text: string, failedMessage: string) => {
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
	}, []);

	const copyName = useCallback(() => {
		void copy(id, card.copyNameFailed());
	}, [copy, id, card]);

	/**
	 * 主动作分流：带修饰键 → 多选；否则 → 复制名称。
	 *
	 * 鼠标路径由卡片根节点在**捕获阶段**拦下（见 handleRootCapture），
	 * 这里主要服务键盘路径（字形聚焦后按 Enter / 空格）。
	 */
	const handleActivate = useCallback(
		(e: React.MouseEvent | React.KeyboardEvent) => {
			const toggle = e.ctrlKey || e.metaKey;
			const range = e.shiftKey;
			if ((toggle || range) && onModifierClick) {
				e.preventDefault();
				onModifierClick(id, { toggle, range });
				return;
			}
			copyName();
		},
		[copyName, id, onModifierClick],
	);

	/**
	 * 修饰键点击在图块**任意位置**都生效——图标区铺满整卡，只剩边缝与按钮区。
	 *
	 * 走捕获阶段并 stopPropagation：这样图标区的点击处理不会再跑一遍
	 * （否则同一次点击会先选中、又复制名称）。操作按钮区排除在外，
	 * 免得 Ctrl+点击星标变成了选中卡片。
	 */
	const handleRootCapture = useCallback(
		(e: React.MouseEvent) => {
			if (!onModifierClick) {
				return;
			}
			const toggle = e.ctrlKey || e.metaKey;
			const range = e.shiftKey;
			if (!toggle && !range) {
				return;
			}
			const target = e.target as HTMLElement | null;
			if (target?.closest(".ci-lib-icon__card-actions")) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			onModifierClick(id, { toggle, range });
		},
		[id, onModifierClick],
	);

	// 用户导入的 SVG 存的是裸 id，实际注册 id 带 CI- 前缀；
	// 包图标的 id 本身已是 CI-{packId}-{name}，lucide 的名字即 id
	const fullId = type === "svg" && !id.startsWith("CI-") ? `CI-${id}` : null;

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
					.onClick(() => void copy(fullId, card.copyNameFailed())),
			);
		}

		for (const action of customActions) {
			menu.addItem((item) => {
				item.setTitle(action.title).onClick(
					() => void action.onClick(id),
				);
				if (action.icon) {
					item.setIcon(action.icon);
				}
			});
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
			className={`ci-lib-icon__card${copied ? " is-copied" : ""}${selected ? " is-selected" : ""}${onModifierClick ? " is-selectable" : ""}`}
			onClickCapture={handleRootCapture}
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

			{/*
			  复制成功的瞬时反馈，取代原来每次都弹的系统 Notice。

			  ✓ 只是视觉记号（aria-hidden），文字走 role="status" 的 live region——
			  否则读屏用户对"复制成功"没有任何回音，Notice 又已经撤掉了。
			*/}
			{copied && (
				<span className="ci-lib-icon__card-copied" role="status">
					<Check className="svg-icon" aria-hidden="true" />
					<span className="ci-lib-icon__card-copied-sr">
						{card.copied()}
					</span>
				</span>
			)}

			{/*
			  图标区铺满整卡（方形图块），名称不再可见——改由 aria-label 提供给
			  读屏与辅助技术，悬停 tooltip 里带名称与「点击复制」提示补足可视线索。
			*/}
			<div
				ref={iconRef}
				className="ci-lib-icon__card-icon clickable-icon"
				onClick={handleActivate}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						handleActivate(e);
					}
				}}
				// title={`${id} · ${card.copyNameTooltip()}`}
				role="button"
				tabIndex={0}
				aria-label={id}
				aria-selected={selected}
			></div>
		</div>
	);
});
