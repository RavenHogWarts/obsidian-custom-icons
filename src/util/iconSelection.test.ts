import {
	SelectionState,
	applySelectionClick,
	dropFromSelection,
	emptySelection,
} from "./iconSelection";

const ids = ["a", "b", "c", "d", "e"];
const CTRL = { toggle: true, range: false };
const SHIFT = { toggle: false, range: true };

/** 便于断言：把选区转成按可见顺序排列的数组 */
const list = (state: SelectionState) =>
	ids.filter((id) => state.selected.has(id));

describe("applySelectionClick · Ctrl/Cmd 加选", () => {
	test("依次加选，锚点跟着走", () => {
		let state = applySelectionClick(emptySelection(), ids, "b", CTRL);
		expect(list(state)).toEqual(["b"]);
		expect(state.anchorId).toBe("b");

		state = applySelectionClick(state, ids, "d", CTRL);
		expect(list(state)).toEqual(["b", "d"]);
		expect(state.anchorId).toBe("d");
	});

	test("再点一次取消该项", () => {
		let state = applySelectionClick(emptySelection(), ids, "b", CTRL);
		state = applySelectionClick(state, ids, "b", CTRL);
		expect(list(state)).toEqual([]);
	});
});

describe("applySelectionClick · Shift 连选", () => {
	test("从锚点连选到目标（含两端）", () => {
		let state = applySelectionClick(emptySelection(), ids, "b", CTRL);
		state = applySelectionClick(state, ids, "d", SHIFT);
		expect(list(state)).toEqual(["b", "c", "d"]);
	});

	test("反向连选同样成立", () => {
		let state = applySelectionClick(emptySelection(), ids, "d", CTRL);
		state = applySelectionClick(state, ids, "b", SHIFT);
		expect(list(state)).toEqual(["b", "c", "d"]);
	});

	test("连选不移动锚点：可反复 Shift+点击调整区间末端", () => {
		let state = applySelectionClick(emptySelection(), ids, "b", CTRL);
		state = applySelectionClick(state, ids, "e", SHIFT);
		expect(state.anchorId).toBe("b");
		// 再 Shift+点击 c，仍然从 b 起算（而不是从上一次的 e）
		state = applySelectionClick(state, ids, "c", SHIFT);
		expect(state.anchorId).toBe("b");
		expect(list(state)).toEqual(["b", "c", "d", "e"]);
	});

	test("没有锚点时 Shift+点击退化成加选，并立起锚点", () => {
		const state = applySelectionClick(emptySelection(), ids, "c", SHIFT);
		expect(list(state)).toEqual(["c"]);
		expect(state.anchorId).toBe("c");
	});

	test("锚点已不在可见列表（换了搜索词）时退化成加选", () => {
		const state: SelectionState = {
			selected: new Set(["x"]),
			anchorId: "x",
		};
		const next = applySelectionClick(state, ids, "c", SHIFT);
		expect(next.selected.has("c")).toBe(true);
		expect(next.anchorId).toBe("c");
	});

	test("连选是并集，不会抹掉先前 Ctrl 加选的项", () => {
		let state = applySelectionClick(emptySelection(), ids, "a", CTRL);
		state = applySelectionClick(state, ids, "c", CTRL);
		state = applySelectionClick(state, ids, "e", SHIFT);
		expect(list(state)).toEqual(["a", "c", "d", "e"]);
	});
});

describe("applySelectionClick · 边界", () => {
	test("点了不在列表里的 id 时原样返回", () => {
		const before = applySelectionClick(emptySelection(), ids, "a", CTRL);
		const after = applySelectionClick(before, ids, "zzz", CTRL);
		expect(after).toBe(before);
	});

	test("不改动入参选区", () => {
		const before = applySelectionClick(emptySelection(), ids, "a", CTRL);
		const snapshot = [...before.selected];
		applySelectionClick(before, ids, "c", SHIFT);
		expect([...before.selected]).toEqual(snapshot);
	});

	test("emptySelection 同时清掉锚点", () => {
		expect(emptySelection()).toEqual({
			selected: new Set(),
			anchorId: null,
		});
	});
});

describe("dropFromSelection", () => {
	test("移除选中项，其余保留", () => {
		let state = applySelectionClick(emptySelection(), ids, "a", CTRL);
		state = applySelectionClick(state, ids, "c", CTRL);
		state = dropFromSelection(state, "a");
		expect(list(state)).toEqual(["c"]);
	});

	test("被移除的项同时是锚点时，锚点一并清掉", () => {
		const state = applySelectionClick(emptySelection(), ids, "b", CTRL);
		expect(state.anchorId).toBe("b");
		expect(dropFromSelection(state, "b").anchorId).toBeNull();
	});

	test("移除的不是锚点时，锚点保持不动", () => {
		let state = applySelectionClick(emptySelection(), ids, "a", CTRL);
		state = applySelectionClick(state, ids, "c", CTRL);
		expect(dropFromSelection(state, "a").anchorId).toBe("c");
	});

	test("与选区无关的 id 原样返回（不产生新对象）", () => {
		const state = applySelectionClick(emptySelection(), ids, "a", CTRL);
		expect(dropFromSelection(state, "zzz")).toBe(state);
	});

	test("不改动入参选区", () => {
		const state = applySelectionClick(emptySelection(), ids, "a", CTRL);
		dropFromSelection(state, "a");
		expect([...state.selected]).toEqual(["a"]);
	});
});
