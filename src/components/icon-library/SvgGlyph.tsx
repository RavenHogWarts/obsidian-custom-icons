import { useEffect, useRef } from "react";

interface SvgGlyphProps {
	/** SVG 字符串（调用方保证已过 sanitize / validate） */
	svg: string;
	/** 容器类名，决定字形尺寸与布局 */
	className?: string;
	/** 无障碍标签；不传则视为纯装饰（aria-hidden） */
	label?: string;
}

/**
 * 以 DOM 节点方式注入一段 SVG 字符串。
 *
 * 走 `DOMParser` + `importNode` 而不是 `innerHTML`：既避免 React 的
 * `dangerouslySetInnerHTML`，也保证节点归属当前窗口的 document（跨 popout 场景）。
 * 解析失败时静默留空，不影响同屏其余字形。
 */
export const SvgGlyph: React.FC<SvgGlyphProps> = ({
	svg,
	className,
	label,
}) => {
	const ref = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const container = ref.current;
		if (!container) {
			return;
		}
		container.empty();
		try {
			const parsed = new DOMParser().parseFromString(
				svg,
				"image/svg+xml",
			);
			const el = parsed.documentElement;
			if (
				el &&
				el.tagName.toLowerCase() === "svg" &&
				container.ownerDocument
			) {
				container.appendChild(
					container.ownerDocument.importNode(el, true),
				);
			}
		} catch {
			// 单个字形解析失败时静默跳过
		}
	}, [svg]);

	return (
		<span
			ref={ref}
			className={className}
			aria-label={label}
			aria-hidden={label ? undefined : "true"}
		/>
	);
};
