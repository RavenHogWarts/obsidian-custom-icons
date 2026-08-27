import { getIconIds } from "obsidian";
import { hasLucideIcon } from "./getLucideIcons";
import { buildIconRenderable, type IconRenderable } from "./iconRenderable";

/**
 * 接好线的「图标画得出来吗」判定，**一轮 apply 建一个**。
 *
 * 判定逻辑本身住在 `iconRenderable.ts`（纯函数、可单测）；这一层只负责把
 * obsidian 的 `getIconIds` 与 `hasLucideIcon` 喂进去。拆成两个文件是必须的：
 * 各级 resolve 函数都要 import 那个类型，若判定逻辑直接 import obsidian，
 * 那几份纯函数单测会整片报「Cannot find module 'obsidian'」。
 */
export function createIconRenderable(): IconRenderable {
	return buildIconRenderable({
		getIconIds,
		hasLucide: hasLucideIcon,
	});
}
