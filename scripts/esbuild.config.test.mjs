import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

config();

const banner =``;

const prod = (process.argv[2] === "production");
let outdir = "./";

if(process.env.OUT === "1"){
	const vaultDir = process.env.REAL === "1" ? process.env.REAL_VAULT : process.env.TEST_VAULT;
	fs.promises.copyFile(
		path.join("./", "manifest.json"),
		path.join(vaultDir, "manifest.json")
	);
	outdir = vaultDir;
}

console.info(`\nSaving plugin to ${outdir}\n`);

const renamePlugin = () => ({
	name: "rename-plugin",
	setup(build) {
		build.onEnd(async (result) => {
			const parent = build.initialOptions.outdir;;
			const cssFileName = parent + "/main.css";
			const newCssFileName = parent + "/styles.css";
			try {
				fs.renameSync(cssFileName, newCssFileName);
			} catch (e) {
				console.error("Failed to rename file:", e);
			}
		});
	},
});

esbuild.build({
	banner: {
		js: banner,
	},
	entryPoints: ["src/main.ts"],
	bundle: true,
	plugins: [renamePlugin()],
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins],
	format: "cjs",
	target: "es2018",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	outdir: outdir,
	minify: prod,
}).catch(() => process.exit(1));