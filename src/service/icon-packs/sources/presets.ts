/**
 * npm 散装 SVG 一键预设（调研核实过的路径规则，见 dev/260819 方案文档 §4.2）
 * 仅收录官方渠道提供散装 SVG 的包；Phosphor 等纯字体包请走 Iconify 源。
 */
export interface INpmSvgPreset {
	/** 安装后的包 id（图标命名空间：CI-{id}-{name}） */
	id: string;
	name: string;
	package: string;
	glob: string;
	license?: string;
}

export const NPM_SVG_PRESETS: INpmSvgPreset[] = [
	{
		id: "fa",
		name: "Font Awesome Free",
		package: "@fortawesome/fontawesome-free",
		glob: "svgs/{solid,regular,brands}/*.svg",
		license: "CC BY 4.0 / MIT / OFL",
	},
	{
		id: "tabler-outline",
		name: "Tabler Icons (Outline)",
		package: "@tabler/icons",
		glob: "icons/outline/*.svg",
		license: "MIT",
	},
	{
		id: "tabler-filled",
		name: "Tabler Icons (Filled)",
		package: "@tabler/icons",
		glob: "icons/filled/*.svg",
		license: "MIT",
	},
	{
		id: "heroicons-outline",
		name: "Heroicons (24 Outline)",
		package: "heroicons",
		glob: "24/outline/*.svg",
		license: "MIT",
	},
	{
		id: "heroicons-solid",
		name: "Heroicons (24 Solid)",
		package: "heroicons",
		glob: "24/solid/*.svg",
		license: "MIT",
	},
	{
		id: "mdi-filled",
		name: "Material Design (Filled)",
		package: "@material-design-icons/svg",
		glob: "filled/*.svg",
		license: "Apache-2.0",
	},
	{
		id: "mdi-outlined",
		name: "Material Design (Outlined)",
		package: "@material-design-icons/svg",
		glob: "outlined/*.svg",
		license: "Apache-2.0",
	},
	{
		id: "boxicons",
		name: "Boxicons",
		package: "boxicons",
		glob: "svg/**/*.svg",
		license: "CC BY 4.0",
	},
	{
		id: "remix",
		name: "Remix Icon",
		package: "remixicon",
		glob: "icons/**/*.svg",
		license: "Apache-2.0",
	},
	{
		id: "bi",
		name: "Bootstrap Icons",
		package: "bootstrap-icons",
		glob: "icons/*.svg",
		license: "MIT",
	},
];
