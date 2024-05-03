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

esbuild.build({
	banner: {
		js: banner,
	},
	entryPoints: ["src/main.ts", "src/styles.css"],
	bundle: true,
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