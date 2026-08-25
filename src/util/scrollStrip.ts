/**
 * 横向滚动条（页签行 / 分段行）的滚动位置计算。
 *
 * 抽成纯函数是为了能直接测：真实元素的这几个量要靠布局才拿得到，
 * 而这里要保证的是「最小位移」与「不越界」两条规则本身。
 *
 * 只处理 LTR：插件当前四种语言（en / zh / zh-TW / ru）都是从左到右，
 * RTL 下 scrollLeft 的取值范围各浏览器不一，届时再单独处理。
 */

/** 滚动容器的当前状态（取自元素同名属性） */
export interface StripView {
	scrollLeft: number;
	clientWidth: number;
	scrollWidth: number;
}

/** 容器内某一项的位置，start 相对**滚动内容**起点（不是视口左边缘） */
export interface StripItem {
	start: number;
	size: number;
}

/**
 * 让某一项进入可视区所需的新 scrollLeft；已经可见（或容器不可滚动）时返回 null。
 *
 * 采用**最小位移**：左侧出界就贴左、右侧出界就贴右，而不是把当前项拽到正中间——
 * 居中会让相邻两段之间的切换看起来"整排都在跳"。`padding` 留出一条邻项的边，
 * 顺便暗示这个方向还有内容。
 */
export function nextScrollLeft(
	view: StripView,
	item: StripItem,
	padding = 0,
): number | null {
	const maxScrollLeft = Math.max(0, view.scrollWidth - view.clientWidth);
	if (maxScrollLeft === 0) {
		return null;
	}

	const clamp = (value: number) =>
		Math.min(Math.max(value, 0), maxScrollLeft);
	const start = item.start - padding;
	const end = item.start + item.size + padding;

	let target: number;
	if (start < view.scrollLeft) {
		target = clamp(start);
	} else if (end > view.scrollLeft + view.clientWidth) {
		target = clamp(end - view.clientWidth);
	} else {
		return null;
	}

	// 夹取后可能正好等于当前值（首/末项贴边时）：此时同样不必写 scrollLeft
	return target === view.scrollLeft ? null : target;
}

/** 哪一侧还有被遮住的内容 */
export type OverflowSides = "none" | "start" | "end" | "both";

/**
 * 判断两端的溢出情况，供 CSS 在对应一侧画淡出边缘。
 *
 * `tolerance` 吸收亚像素误差：缩放比例非整数时 scrollWidth 与 clientWidth
 * 常差个零点几像素，不容差的话会凭空多出一条淡出边。
 */
export function overflowSides(view: StripView, tolerance = 1): OverflowSides {
	const maxScrollLeft = view.scrollWidth - view.clientWidth;
	if (maxScrollLeft <= tolerance) {
		return "none";
	}
	const atStart = view.scrollLeft <= tolerance;
	const atEnd = view.scrollLeft >= maxScrollLeft - tolerance;
	if (atStart && atEnd) {
		return "none";
	}
	if (atStart) {
		return "end";
	}
	if (atEnd) {
		return "start";
	}
	return "both";
}
