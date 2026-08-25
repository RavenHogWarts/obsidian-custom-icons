/**
 * 图标选择器的按键决策（纯函数，供 IconPickerModal 的 keydown 派发）。
 *
 * 抽出来是为了能测：键位逻辑的边界（输入法组合期、光标贴边、空分组）都在这里，
 * 而 jest 的 testMatch 只收 `.ts`，留在 `.tsx` 组件里就一行覆盖不到。
 */

/** 一次按键要触发的动作。`none` = 不接管，交回输入框 / 浏览器 */
export type PickerAction =
	| { kind: "none" }
	| { kind: "segment"; delta: 1 | -1 }
	| { kind: "move"; delta: number }
	| { kind: "select" }
	| { kind: "favorite" }
	| { kind: "clear" };

export interface PickerKeyInput {
	key: string;
	shiftKey: boolean;
	/** Ctrl（Win/Linux）或 Meta（macOS） */
	mod: boolean;
	/**
	 * 输入法组合中（`KeyboardEvent.isComposing`）。
	 *
	 * 中文输入法开着时，Enter 是「确认候选词」、方向键是「翻候选词」，
	 * 都不该被当成选定图标或挪动网格高亮——误开输入法是常事。
	 */
	composing: boolean;
	/** 光标贴在输入框最左端（含无选区） */
	caretAtStart: boolean;
	/** 光标贴在输入框最右端 */
	caretAtEnd: boolean;
	/** 网格当前列数：上下键跨一整行 */
	columns: number;
}

const NONE: PickerAction = { kind: "none" };

/**
 * 把一次 keydown 映射成动作。
 *
 * 调用方对除 `none` 以外的一切动作 `preventDefault()`；`segment` 还要再问一次
 * `nextSegmentIndex`——那边返回 null 时表示该方向已无分组，此时同样要放行
 * （见该函数的说明）。
 */
export function decidePickerKey(input: PickerKeyInput): PickerAction {
	// 组合期一律放行：此刻所有按键都属于输入法，不属于这个弹窗
	if (input.composing) {
		return NONE;
	}

	if (input.key === "Tab") {
		return { kind: "segment", delta: input.shiftKey ? -1 : 1 };
	}
	if (input.mod && input.key === "Backspace") {
		return { kind: "clear" };
	}
	if (input.key === "Enter") {
		return input.mod ? { kind: "favorite" } : { kind: "select" };
	}

	// 上下键单行输入框用不到，直接接管；左右键要先让给光标移动，
	// 只有光标已经贴到相应一端时才用于网格走位
	if (input.key === "ArrowDown") {
		return { kind: "move", delta: input.columns };
	}
	if (input.key === "ArrowUp") {
		return { kind: "move", delta: -input.columns };
	}
	if (input.key === "ArrowRight" && input.caretAtEnd) {
		return { kind: "move", delta: 1 };
	}
	if (input.key === "ArrowLeft" && input.caretAtStart) {
		return { kind: "move", delta: -1 };
	}

	return NONE;
}

/**
 * 求 Tab / Shift+Tab 的目标分组下标。
 *
 * **回绕**：末段再按 Tab 回到首段，首段 Shift+Tab 到末段。分段行是这个弹窗的
 * 主要走法，走到尽头把焦点甩出去会让「Tab 换段」这件事变得不可预期。
 * 代价是 Tab 不再能到达底栏控件，因此底栏的功能必须另有键位可达
 *（清除图标 = Mod+Backspace，关闭 = Esc；见 IconPickerModal 的键位提示条）。
 *
 * @param totals 与分组同序的命中数
 * @param skipEmpty 跳过 0 命中的分组。**仅在有查询词时开启**：无查询时空分组
 *                  （还没有收藏 / 最近）要留着，它的空态文案本身就是引导。
 * @returns 目标下标；无处可去（只有一个分组、或跳空后一圈下来没有别的非空分组）
 *          时为 null，此时调用方原地不动
 */
export function nextSegmentIndex(
	totals: readonly number[],
	current: number,
	delta: 1 | -1,
	skipEmpty: boolean,
): number | null {
	const size = totals.length;
	// 最多走 size - 1 步：一圈之内必然回到起点，不必也不该停在自己身上
	for (let step = 1; step < size; step++) {
		// 双取模：delta 为 -1 时 JS 的 % 会给出负数
		const at = (((current + delta * step) % size) + size) % size;
		if (!skipEmpty || totals[at] > 0) {
			return at;
		}
	}
	return null;
}
