import eslint from "@eslint/js";
import obsidianmd from "eslint-plugin-obsidianmd";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const obsidianGlobals = {
	createEl: "readonly",
	createDiv: "readonly",
	createSpan: "readonly",
	createSvg: "readonly",
	createFragment: "readonly",
	activeDocument: "readonly",
	activeWindow: "readonly",
};

export default defineConfig([
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...obsidianGlobals,
				...globals.mocha,
				React: "readonly",
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: [
						"eslint.config.mjs",
						"manifest.json",
						"package.json",
						"tsconfig.json",
					],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: [".json"],
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		files: ["**/*.json"],
		rules: {
			"obsidianmd/no-plugin-as-component": "off",
			"@typescript-eslint/no-unused-expressions": "off",
		},
	},
	{
		files: ["src/i18n/**/*"],
		// 语言包文件由 typesafe-i18n 生成，但含面向用户的翻译文案：
		// 文案中提及 .obsidian 等路径属于说明文字而非代码路径，豁免
		rules: {
			"eslint-comments/no-unlimited-disable": "off",
			"eslint-comments/disable-enable-pair": "off",
			"eslint-comments/no-restricted-disable": "off",
			"@typescript-eslint/no-empty-object-type": "off",
			"no-irregular-whitespace": "off",
			"obsidianmd/hardcoded-config-path": "off",
		},
		linterOptions: {
			// 生成文件头部的 eslint-disable 引用了 typescript-eslint v8
			// 已移除的 ban-types 规则，且 no-irregular-whitespace 已豁免，
			// 这些指令注释全部失效，不再报告
			reportUnusedDisableDirectives: "off",
		},
	},
	{
		files: ["**/*.test.ts", "**/*.spec.ts"],
		languageOptions: {
			globals: {
				...globals.jest,
			},
		},
	},
	globalIgnores([
		"node_modules",
		"dist",
		".obsidian-cache",
		".vscode",
		"versions.json",
		"main.js",
		"package-lock.json",
		// typesafe-i18n 生成的运行时胶水代码（头部带过期的 eslint-disable 注释，
		// 重新生成会覆盖手工修改），不参与 lint
		"src/i18n/i18n-util.ts",
		"src/i18n/i18n-util.sync.ts",
		"src/i18n/i18n-util.async.ts",
		"src/i18n/i18n-react.tsx",
		"src/i18n/i18n-types.ts",
	]),
]);
