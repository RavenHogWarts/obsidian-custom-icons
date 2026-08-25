import {
	OverflowSides,
	nextScrollLeft,
	overflowSides,
} from "@src/util/scrollStrip";
import { useCallback, useEffect, useRef } from "react";
// 样式与行为同进同出：本 hook 要能滚，容器就必须是 overflow-x: auto 且隐藏
// 原生滚动条，淡出边缘也依赖它写的 data-overflow。放在这里，用了 hook 就一定
// 有配套样式，不会出现「加了 hook 忘了加 class 所以不动」
import "./useStripAutoScroll.css";

/** 当前项两侧留出的余量：露出一条邻项的边，暗示这个方向还有内容 */
const EDGE_PADDING = 12;

/**
 * 「当前项」的定位方式。
 *
 * 用 aria-selected 而不是各家自己的 class：两个调用方都是 tablist
 * （页签行的 Radix Trigger、选择器的分段按钮），本来就都得给出这个属性，
 * 于是无障碍语义直接当成了选中态的唯一真相，不必再约定一套 class。
 */
const ACTIVE_ITEM = '[aria-selected="true"]';

/**
 * 横向页签/分段行：把当前项滚进可视区，并在被遮住的一侧标出溢出。
 *
 * 解决的是「装了几个图标包后靠后的分段直接看不见」——容器本来就
 * `overflow-x: auto`，但滚动条被隐藏（`scrollbar-width: none`），
 * 于是既没有可滚提示，切到靠后的项也不会自己滚过去。
 *
 * 溢出情况写在容器的 `data-overflow` 上（none / start / end / both），
 * 由 CSS 画淡出边缘——比在 JS 里改样式好调试，也不产生额外渲染。
 *
 * 竖排页签行不必特殊对待：那种布局没有横向溢出，对位算出来就是「不用滚」，
 * 而它在窄屏下会转成横排，此时又该滚了——交给同一套逻辑判断反倒更准。
 *
 * @param activeKey 当前项标识；变化时重新对位。`undefined`（一个页签都没有）
 *                  时只保留溢出提示。
 */
export function useStripAutoScroll<T extends HTMLElement>(
	activeKey: string | undefined,
): React.RefObject<T> {
	const ref = useRef<T>(null);
	// 首次对位不做动画：进来就该在正确位置，滑一下反而像页面自己在动
	const animate = useRef(false);
	// 本轮对位是否还没落地。容器尚无布局时算不出目标，得等尺寸就绪再补一次
	const pending = useRef(false);

	const syncOverflow = useCallback(() => {
		const el = ref.current;
		if (!el) {
			return;
		}
		const sides: OverflowSides = overflowSides(el);
		el.dataset.overflow = sides;
	}, []);

	const align = useCallback(() => {
		const el = ref.current;
		if (!el) {
			return;
		}
		// 弹窗刚挂载时容器还没有布局，此时 scrollWidth === clientWidth === 0，
		// 算出来永远是「不用滚」。留给 ResizeObserver 重试，否则落点在靠后
		// 分段时（比如上次停在某个图标包），打开选择器根本不会滚过去
		if (el.clientWidth === 0) {
			return;
		}

		const active = el.querySelector<HTMLElement>(ACTIVE_ITEM);
		if (active) {
			// 用 rect 而非 offsetLeft：offsetLeft 相对 offsetParent，
			// 而滚动容器不一定就是 offsetParent（这里两者恰好一致，但不该依赖）
			const itemRect = active.getBoundingClientRect();
			const hostRect = el.getBoundingClientRect();
			const target = nextScrollLeft(
				el,
				{
					start: itemRect.left - hostRect.left + el.scrollLeft,
					size: itemRect.width,
				},
				EDGE_PADDING,
			);
			if (target !== null) {
				// 取元素所在窗口而非全局 window：分离窗口（popout）里的弹窗
				// 挂在另一个 document 上，全局 window 的媒体查询未必是同一块屏
				const reduced =
					el.ownerDocument.defaultView?.matchMedia(
						"(prefers-reduced-motion: reduce)",
					).matches ?? false;
				el.scrollTo({
					left: target,
					behavior: animate.current && !reduced ? "smooth" : "auto",
				});
			}
		}

		animate.current = true;
		pending.current = false;
	}, []);

	// 当前项对位：activeKey 变化时滚过去
	useEffect(() => {
		if (activeKey !== undefined) {
			pending.current = true;
			align();
		}
		syncOverflow();
	}, [activeKey, align, syncOverflow]);

	useEffect(() => {
		const el = ref.current;
		if (!el) {
			return;
		}

		el.addEventListener("scroll", syncOverflow, { passive: true });

		const ro = new ResizeObserver(() => {
			// 容器刚拿到布局：把上面没算成的那次对位补上。
			// pending 落地后不再重算，免得用户手动横滚后一次窗口缩放就被拽回去
			if (pending.current) {
				align();
			}
			syncOverflow();
		});
		ro.observe(el);

		// 项的增减、文案变化都会改变 scrollWidth，而容器尺寸没变、
		// ResizeObserver 不会响（装卸图标包就是这样改变分段数量的）。
		// 只看 childList/characterData，不看 attributes——syncOverflow 自己
		// 就在写 data-overflow，看了会自激
		const mo = new MutationObserver(syncOverflow);
		mo.observe(el, {
			childList: true,
			subtree: true,
			characterData: true,
		});

		syncOverflow();

		return () => {
			el.removeEventListener("scroll", syncOverflow);
			ro.disconnect();
			mo.disconnect();
		};
	}, [align, syncOverflow]);

	return ref;
}
