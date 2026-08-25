import {
	PickerKeyInput,
	decidePickerKey,
	nextSegmentIndex,
} from "./pickerKeys";

/** 默认：无修饰键、非组合期、光标两端都不贴（中间）、4 列 */
function press(overrides: Partial<PickerKeyInput> & { key: string }) {
	return decidePickerKey({
		shiftKey: false,
		mod: false,
		composing: false,
		caretAtStart: false,
		caretAtEnd: false,
		columns: 4,
		...overrides,
	});
}

describe("decidePickerKey", () => {
	test("Tab / Shift+Tab 换分组", () => {
		expect(press({ key: "Tab" })).toEqual({ kind: "segment", delta: 1 });
		expect(press({ key: "Tab", shiftKey: true })).toEqual({
			kind: "segment",
			delta: -1,
		});
	});

	test("Enter 选定，加修饰键则收藏", () => {
		expect(press({ key: "Enter" })).toEqual({ kind: "select" });
		expect(press({ key: "Enter", mod: true })).toEqual({
			kind: "favorite",
		});
	});

	test("修饰键 + Backspace 清除图标", () => {
		expect(press({ key: "Backspace", mod: true })).toEqual({
			kind: "clear",
		});
	});

	test("裸 Backspace 不接管（要能删字）", () => {
		expect(press({ key: "Backspace" })).toEqual({ kind: "none" });
	});

	test("上下键跨整行", () => {
		expect(press({ key: "ArrowDown", columns: 6 })).toEqual({
			kind: "move",
			delta: 6,
		});
		expect(press({ key: "ArrowUp", columns: 6 })).toEqual({
			kind: "move",
			delta: -6,
		});
	});

	test("左右键只在光标贴到相应一端时才走位", () => {
		expect(press({ key: "ArrowRight" })).toEqual({ kind: "none" });
		expect(press({ key: "ArrowLeft" })).toEqual({ kind: "none" });
		expect(press({ key: "ArrowRight", caretAtEnd: true })).toEqual({
			kind: "move",
			delta: 1,
		});
		expect(press({ key: "ArrowLeft", caretAtStart: true })).toEqual({
			kind: "move",
			delta: -1,
		});
	});

	test("普通字符不接管", () => {
		expect(press({ key: "a" })).toEqual({ kind: "none" });
		expect(press({ key: "Escape" })).toEqual({ kind: "none" });
	});

	describe("输入法组合期一律放行", () => {
		// 中文输入法开着时：Enter 是确认候选词，方向键是翻候选词，
		// 都不该被弹窗接管（否则确认个候选词就把图标选定并关窗了）
		const keys = ["Enter", "Tab", "ArrowDown", "ArrowUp", "ArrowRight"];
		for (const key of keys) {
			test(key, () => {
				expect(
					press({
						key,
						composing: true,
						mod: key === "Enter",
						caretAtEnd: true,
					}),
				).toEqual({ kind: "none" });
			});
		}
	});
});

describe("nextSegmentIndex", () => {
	const totals = [3, 0, 5, 0, 2];

	test("不跳空时就是相邻一个", () => {
		expect(nextSegmentIndex(totals, 0, 1, false)).toBe(1);
		expect(nextSegmentIndex(totals, 2, -1, false)).toBe(1);
	});

	test("跳空时越过 0 命中的分组", () => {
		expect(nextSegmentIndex(totals, 0, 1, true)).toBe(2);
		expect(nextSegmentIndex(totals, 2, 1, true)).toBe(4);
		expect(nextSegmentIndex(totals, 2, -1, true)).toBe(0);
	});

	test("到尽头回绕", () => {
		expect(nextSegmentIndex(totals, 4, 1, false)).toBe(0);
		expect(nextSegmentIndex(totals, 0, -1, false)).toBe(4);
	});

	test("回绕时同样跳过空分组", () => {
		// 末段往后回绕到首段（命中 3，非空）
		expect(nextSegmentIndex(totals, 4, 1, true)).toBe(0);
		// 首段往前回绕到末段（命中 2，非空）
		expect(nextSegmentIndex(totals, 0, -1, true)).toBe(4);
		// 回绕途中要跳空：从 2 往前，1 是空的，落到 0
		expect(nextSegmentIndex([3, 0, 5], 2, -1, true)).toBe(0);
		// 从 0 往前回绕：2 非空，直接落 2
		expect(nextSegmentIndex([3, 0, 5], 0, -1, true)).toBe(2);
	});

	test("跳空后一圈下来没有别的非空分组则原地不动", () => {
		expect(nextSegmentIndex([1, 0, 0], 0, 1, true)).toBeNull();
		expect(nextSegmentIndex([0, 0, 1], 2, -1, true)).toBeNull();
	});

	test("单个分组：无处可去（不停在自己身上）", () => {
		expect(nextSegmentIndex([7], 0, 1, false)).toBeNull();
		expect(nextSegmentIndex([7], 0, -1, false)).toBeNull();
	});

	test("空列表不越界", () => {
		expect(nextSegmentIndex([], 0, 1, false)).toBeNull();
		expect(nextSegmentIndex([], 0, -1, true)).toBeNull();
	});
});
