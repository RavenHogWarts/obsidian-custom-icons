import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * 契约有两份副本，必须逐字同步：
 *
 * | 文件 | 角色 |
 * | --- | --- |
 * | `src/api/types.ts` | 权威源码，本插件自己编译它 |
 * | `dev/ecosystem/custom-icons-api.d.ts` | **给消费方复制的副本**（不发 npm 包） |
 *
 * 漂移的代价不在本仓库内——它落在消费方那边：类型说有某个字段、运行时却没有，
 * 或者反过来。而这类漂移无声无息，本仓库的 tsc 与 lint 都不会察觉。
 *
 * 唯一允许的差异是变更事件的声明形态：源码给 `const`（要有运行时值），
 * 副本只给类型（`.d.ts` 不产出运行时代码，声明成 const 再 import 会拿到
 * undefined）。除此之外两边的声明必须一致。
 */

const ROOT = join(__dirname, "..");

/**
 * 副本住在 `dev/`，而 `dev/` 在 .gitignore 里——新克隆的仓库没有它。
 * 那种情况下本套件整体跳过（`describe.skip`），而不是红一片：
 * 这个守卫服务的是**改契约的人**，不是「必须拥有 dev/ 才能跑测试」。
 */
const COPY_PATH = join(ROOT, "dev", "ecosystem", "custom-icons-api.d.ts");

/** 事件名声明：两边形态刻意不同（见文件头注释），比对时各自剔除 */
const EVENT_DECL = /^export (const CUSTOM_ICONS_CHANGED|type CustomIconsChangedEvent)\b.*$/;

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

const suite = existsSync(COPY_PATH) ? describe : describe.skip;

suite("跨插件契约的两份副本保持同步", () => {
	const authoritative = readFileSync(
		join(ROOT, "src", "api", "types.ts"),
		"utf8",
	);
	const copy = readFileSync(COPY_PATH, "utf8");

	test("声明逐行一致（改了 src/api/types.ts 就要同步那份 d.ts）", () => {
		expect(declarationsOf(copy)).toEqual(declarationsOf(authoritative));
	});

	test("副本不含任何运行时值导出", () => {
		// `.d.ts` 里的 const / function / class 导出对消费方是陷阱：
		// 打包后没有对应实现，import 到的是 undefined
		const valueExports = copy.match(
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
