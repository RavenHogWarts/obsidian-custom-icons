import { useCallback } from "react";

/** 事件目标是否正在接受文本输入（此时不抢它的按键） */
function isTypingTarget(target: EventTarget | null): boolean {
	// 用 tagName 而不是 instanceof：跨 popout 窗口时构造函数不同源，
	// instanceof HTMLInputElement 会误判为 false
	const el = target as (HTMLElement & { isContentEditable?: boolean }) | null;
	const tag = el?.tagName;
	return (
		tag === "INPUT" ||
		tag === "TEXTAREA" ||
		tag === "SELECT" ||
		el?.isContentEditable === true
	);
}

/**
 * 图标库页内快捷键：`/` 聚焦搜索框、`Esc` 清空搜索。
 *
 * 返回的处理器挂到页面根容器的 `onKeyDown` 上（容器需要 `tabIndex={-1}`，
 * 否则点击非可聚焦子元素后焦点跑到 body，按键不会冒泡到这里）。
 */
export function useLibShortcuts(
	inputRef: React.RefObject<HTMLInputElement | null>,
	onClearSearch: () => void,
) {
	return useCallback(
		(e: React.KeyboardEvent<HTMLElement>) => {
			if (e.key === "/" && !isTypingTarget(e.target)) {
				e.preventDefault();
				inputRef.current?.focus();
				inputRef.current?.select();
				return;
			}
			// 只在搜索框自己里接管 Esc：先清空查询，而不是直接关掉整个视图
			if (e.key === "Escape" && e.target === inputRef.current) {
				e.preventDefault();
				e.stopPropagation();
				onClearSearch();
			}
		},
		[inputRef, onClearSearch],
	);
}
