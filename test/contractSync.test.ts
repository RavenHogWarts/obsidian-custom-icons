import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * 契约的每一份副本都必须与权威源码逐字同步。
 *
 * | 文件 | 角色 | 提交了吗 |
 * | --- | --- | --- |
 * | `src/api/types.ts` | 权威源码，本插件自己编译它 | 是 |
 * | `docs/custom-icons-api.d.ts` | **给消费方复制的发布副本** | 是 |
 * | `dev/ecosystem/custom-icons-api.d.ts` | 方案成文时的落脚处 | 否（`dev/` 被 gitignore） |
 *
 * 漂移的代价不在本仓库内——它落在消费方那边：类型说有某个字段、运行时却没有，
 * 或者反过来。而这类漂移无声无息，本仓库的 tsc 与 lint 都不会察觉。
 *
 * **`docs/` 那份是必查项**（{@link REQUIRED_COPIES}）：它是唯一被提交的副本，
 * 也是消费方仓库的守卫真正比对的目标（`obsidian-inline-icons` 的
 * `test/contractSync.test.ts` 优先读它）。早先本文件只盯 `dev/` 那份，而 `dev/`
 * 在 .gitignore 里——于是发布副本一旦忘了同步，两个仓库的守卫**都不会响**：
 * 这边跳过了没在看的文件，那边比对的是同样陈旧的内容。
 *
 * 唯一允许的差异是变更事件的声明形态：源码给 `const`（要有运行时值），
 * 副本只给类型（`.d.ts` 不产出运行时代码，声明成 const 再 import 会拿到
 * undefined）。除此之外两边的声明必须一致。
 */

const ROOT = join(__dirname, "..");

/**
 * 必须存在且必须同步的副本。缺文件即失败，不跳过——它已提交，
 * 任何一次 checkout 都该有它。
 */
const REQUIRED_COPIES = [join("docs", "custom-icons-api.d.ts")];

/**
 * 存在才查的副本：住在 `dev/` 里，而 `dev/` 被 gitignore，新克隆的仓库没有它。
 * 那种情况下跳过这一份而不是红一片——但**不影响**上面那份必查项。
 */
const OPTIONAL_COPIES = [
	join("dev", "ecosystem", "custom-icons-api.d.ts"),
];

/** 事件名声明：两边形态刻意不同（见文件头注释），比对时各自剔除 */
const EVENT_DECL =
	/^export (const CUSTOM_ICONS_CHANGED|type CustomIconsChangedEvent)\b.*$/;

/**
 * 归一成「只剩声明」的形态：注释是两份文件唯一该各写各的地方
 * （副本的头部讲怎么复制、怎么接入，源码的头部讲同步义务）。
 */
function declarationsOf(source: string): string[] {
	return source
		.replace(/\/\*[\s\S]*?\*\//g, "") // 块注释（含 JSDoc）
		.replace(/\/\/.*$/gm, "") // 行注释
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line !== "")
		.filter((line) => !EVENT_DECL.test(line));
}

const authoritative = readFileSync(
	join(ROOT, "src", "api", "types.ts"),
	"utf8",
);

const copies = [
	...REQUIRED_COPIES,
	...OPTIONAL_COPIES.filter((relative) => existsSync(join(ROOT, relative))),
];

describe("跨插件契约的各份副本保持同步", () => {
	test.each(copies)(
		"%s 的声明与 src/api/types.ts 逐行一致",
		(relative) => {
			// 必查项缺文件时这里直接抛 ENOENT，正是想要的结果
			const copy = readFileSync(join(ROOT, relative), "utf8");
			expect(declarationsOf(copy)).toEqual(declarationsOf(authoritative));
		},
	);

	test.each(copies)("%s 不含任何运行时值导出", (relative) => {
		// `.d.ts` 里的 const / function / class 导出对消费方是陷阱：
		// 打包后没有对应实现，import 到的是 undefined
		const valueExports = readFileSync(join(ROOT, relative), "utf8").match(
			/^export\s+(const|let|var|function|class)\b/gm,
		);
		expect(valueExports).toBeNull();
	});

	test("源码侧仍提供事件名的运行时值", () => {
		// 本插件自己 trigger 时要用它，删掉会让 main.ts 退回写字面量
		expect(authoritative).toMatch(
			/export const CUSTOM_ICONS_CHANGED = "custom-icons:changed"/,
		);
	});
});
