/**
 * 网格多选的纯逻辑（Ctrl/Cmd 加选、Shift 连选）。
 *
 * 抽成纯函数是为了能测：这段逻辑原先写在组件里、混着 `useRef` 与 `setState`
 * 更新函数，导致「更新函数执行时锚点已被改写」的竞态一直看不出来。
 */

/** 锚点用**图标 id** 而不是下标记录：改搜索词 / 换排序后下标会漂，id 不会 */
export interface SelectionState {
	selected: Set<string>;
	anchorId: string | null;
}

export interface SelectionModifiers {
	/** Ctrl / Cmd：加选或取消单个 */
	toggle: boolean;
	/** Shift：从锚点连选一段 */
	range: boolean;
}

/**
 * 计算一次带修饰键的点击之后的选区。
 *
 * @param ids 当前**可见顺序**下的全部 id（连选的区间就按这个顺序取）
 * @param targetId 被点中的 id
 */
export function applySelectionClick(
	state: SelectionState,
	ids: string[],
	targetId: string,
	mods: SelectionModifiers,
): SelectionState {
	const index = ids.indexOf(targetId);
	if (index === -1) {
		return state;
	}

	const anchorIndex =
		state.anchorId !== null ? ids.indexOf(state.anchorId) : -1;
	// 锚点还在可见列表里才谈得上连选；否则退化成加选
	const isRange = mods.range && anchorIndex !== -1;

	if (isRange) {
		const from = Math.min(anchorIndex, index);
		const to = Math.max(anchorIndex, index);
		const selected = new Set(state.selected);
		for (let i = from; i <= to; i++) {
			selected.add(ids[i]);
		}
		// 连选**不移动锚点**：可以反复 Shift+点击调整区间末端（与文件管理器一致）
		return { selected, anchorId: state.anchorId };
	}

	const selected = new Set(state.selected);
	if (selected.has(targetId)) {
		selected.delete(targetId);
	} else {
		selected.add(targetId);
	}
	return { selected, anchorId: targetId };
}

/** 空选区（取消选择时复位，锚点一并清掉） */
export function emptySelection(): SelectionState {
	return { selected: new Set(), anchorId: null };
}

/**
 * 从选区里移除一个 id（图标被删除时同步）。
 *
 * 不这么做的话，「已选 N」会一直把删掉的项算进去，而按 id 过滤的批量动作
 * 又找不到它——计数与实际能操作的东西对不上。它同时是锚点时，锚点一并清掉：
 * 留着一个不存在的锚点会让下一次 Shift 连选退化成加选。
 */
export function dropFromSelection(
	state: SelectionState,
	id: string,
): SelectionState {
	if (!state.selected.has(id) && state.anchorId !== id) {
		return state;
	}
	const selected = new Set(state.selected);
	selected.delete(id);
	return {
		selected,
		anchorId: state.anchorId === id ? null : state.anchorId,
	};
}
