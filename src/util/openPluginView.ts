import { App } from "obsidian";

export default async function (app: App, viewType: string) {
	// 检查是否已经有打开的视图
	const existingLeaves = app.workspace.getLeavesOfType(viewType);

	if (existingLeaves.length > 0) {
		// 如果存在，则激活第一个视图
		await app.workspace.revealLeaf(existingLeaves[0]);
	} else {
		// 如果不存在，则创建新的视图
		const leaf = app.workspace.getLeaf("tab");
		await leaf.setViewState({
			type: viewType,
			active: true,
		});

		await app.workspace.revealLeaf(leaf);
	}
}
