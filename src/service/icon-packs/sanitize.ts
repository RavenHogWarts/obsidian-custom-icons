/**
 * SVG 安全清洗与规范化
 *
 * 用于所有图标库导入路径（Iconify JSON / npm 散装 SVG），
 * 同时应用于用户单个 SVG 的注册时刻（存储内容不动，仅注册时过滤）。
 *
 * 规则：
 * - 根必须是 <svg> 且位于 SVG 命名空间，否则返回 null（无效）
 * - 移除 <script>、<foreignObject> 及 on* 事件属性
 * - 移除外链引用（href/xlink:href 指向非 data: / 非文档内片段的值）
 * - 移除根元素 width/height（沿用 cleanSvg 语义，让图标由 CSS 控制尺寸）
 * - 若全树无任何 fill 声明，根元素补 fill="currentColor"（深色主题可见性）
 */

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

/** 需要整节点移除的元素 */
const FORBIDDEN_TAGS = new Set(["script", "foreignObject"]);

/** 事件属性前缀（onload / onclick / …） */
function isEventAttribute(name: string): boolean {
	return name.length > 2 && name.toLowerCase().startsWith("on");
}

/** 外链引用属性是否安全：仅允许文档内片段（#id）与 data: URI */
function isSafeHref(value: string): boolean {
	const trimmed = value.trim().toLowerCase();
	return trimmed.startsWith("#") || trimmed.startsWith("data:");
}

function sanitizeNode(node: Element): void {
	// 先处理子节点（倒序，边删边遍历安全）
	for (let i = node.children.length - 1; i >= 0; i--) {
		const child = node.children[i];
		if (FORBIDDEN_TAGS.has(child.tagName.toLowerCase())) {
			child.remove();
			continue;
		}
		sanitizeNode(child);
	}

	for (const attr of Array.from(node.attributes)) {
		const name = attr.name.toLowerCase();
		if (isEventAttribute(name)) {
			node.removeAttribute(attr.name);
			continue;
		}
		if (name === "href" || name === "xlink:href") {
			if (!isSafeHref(attr.value)) {
				node.removeAttribute(attr.name);
			}
		}
	}
}

/** 树中是否存在显式 fill 声明（含 "none"） */
function hasFillDeclaration(root: Element): boolean {
	if (root.hasAttribute("fill") || root.getAttribute("style")?.includes("fill")) {
		return true;
	}
	return Array.from(root.querySelectorAll("*")).some(
		(el) => el.hasAttribute("fill") || el.getAttribute("style")?.includes("fill"),
	);
}

/**
 * 清洗一段 SVG 内容
 * @returns 规范化后的 SVG 字符串；无法解析为合法 SVG 时返回 null
 */
export function sanitizeSvg(svgContent: string): string | null {
	if (!svgContent) {
		return null;
	}

	let doc: Document;
	try {
		doc = new DOMParser().parseFromString(svgContent, "image/svg+xml");
	} catch {
		return null;
	}

	const root = doc.documentElement;
	if (
		!root ||
		root.tagName.toLowerCase() !== "svg" ||
		(root.namespaceURI !== SVG_NAMESPACE &&
			!svgContent.includes(SVG_NAMESPACE))
	) {
		return null;
	}

	sanitizeNode(root);
	root.removeAttribute("width");
	root.removeAttribute("height");
	if (!hasFillDeclaration(root)) {
		root.setAttribute("fill", "currentColor");
	}
	// 显式声明命名空间，保证 addIcon 后独立于上下文可用
	root.setAttribute("xmlns", SVG_NAMESPACE);

	return root.outerHTML;
}
