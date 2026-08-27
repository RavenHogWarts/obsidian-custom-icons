import { IconType } from "@src/types/types";

/**
 * 「这个图标现在画得出来吗」。
 *
 * 各级解析函数用它把**画不出来的引用视为「这一级没配」**，让级联继续往下走
 * （文件夹回落到 folderDefault、标签页 / 书签回落到类型级）。
 *
 * @param icon 图标名（`svg` 为注册 id 或裸 id，`lucide` 为 kebab 名）
 */
export type IconRenderable = (
	icon: string | undefined,
	type: IconType | undefined,
) => boolean;

/** 一律可渲染。纯函数单测的默认值，也是「不做存在性判定」时的行为。 */
export const alwaysRenderable: IconRenderable = () => true;

/**
 * `buildIconRenderable` 真正读到的那两件事。
 *
 * 只声明这么多（而不是 import obsidian）是为了让本模块保持**纯函数、可单测**——
 * 各级 resolve 函数都要 import 它，一旦它拖进 obsidian，那几份纯函数单测会整片
 * 报「Cannot find module 'obsidian'」。与 `iconExists.ts` 的 `IconExistenceDeps`
 * 是同一个套路，调用点也同样在各 handler 里现场接线。
 */
export interface IconRenderableDeps {
	/** Obsidian 全局图标注册表的全部 id（生产环境传 obsidian 的 `getIconIds`） */
	getIconIds(): string[];
	/** 该 lucide 名是否可渲染（生产环境传 `hasLucideIcon`） */
	hasLucide(name: string): boolean;
}

/**
 * 建一个判定函数，**一轮 apply 用一个**。
 *
 * 为什么需要它：图标包被停用 / 卸载、用户 SVG 被删之后，五张覆盖表里仍留着
 * `CI-{packId}-{name}` 这类引用。若解析层只看「icon 字段非空」，那条**已经死掉的
 * 引用照样赢下它那一级**，把级联堵死——结果是已渲染的节点残留旧图标（`isSameIcon`
 * 比对 data-icon-* 发现没变、直接跳过重绘），而新建的节点渲染出一块空白占位。
 *
 * 判定顺序与 `setIcon` 的实际回退姿态**必须一致**，否则会出现「判定说能画、
 * 真画时画不出」：
 * - `lucide` 走 lucide-react 现场渲染，**不查注册表**（故差集图标也算能画）；
 * - `svg` 先按原样查注册表，再补 `CI-` 前缀查一次。
 *
 * 注册表快照**惰性建立**：没有 svg 类型的覆盖时一次都不建。建成 Set 而不是逐项
 * `getIcon()`，是因为后者每次都要克隆一个 svg 元素，而文件浏览器会对整棵树逐项判定。
 */
export function buildIconRenderable(deps: IconRenderableDeps): IconRenderable {
	let ids: Set<string> | null = null;

	return (icon, type) => {
		if (!icon) {
			return false;
		}
		if (type === "lucide") {
			return deps.hasLucide(icon);
		}
		ids ??= new Set(deps.getIconIds());
		return ids.has(icon) || ids.has(`CI-${icon}`);
	};
}
