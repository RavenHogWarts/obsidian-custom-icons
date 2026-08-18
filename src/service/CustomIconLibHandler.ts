import { addIcon, removeIcon } from "obsidian";
import { ICustomIconLib } from "../types/types";
import {
	CI_PREFIX,
	dispatchCustomIconsChanged,
	toGlobalIconId,
} from "../util/customIconsGlobal";
import { AbstractIconHandler } from "../util/IconHandler";
import { cleanSvg } from "../util/svgUtils";

export default class CustomIconLibHandler extends AbstractIconHandler<ICustomIconLib> {
	readonly id = "customIconLib";

	apply(): void {
		const svgIcons = this.settings?.svg || [];
		const registeredIds: string[] = [];

		svgIcons.forEach((icon) => {
			if (icon.id && icon.content) {
				const id = toGlobalIconId(icon.id);
				addIcon(id, cleanSvg(icon.content));
				registeredIds.push(id.slice(CI_PREFIX.length));
			}
		});

		// 广播给合作式消费方（其他插件监听后可自行重渲染，见 dev 文档方案 B）
		dispatchCustomIconsChanged(registeredIds);
	}

	cleanup(): void {
		const svgIcons = this.settings?.svg || [];
		svgIcons.forEach((icon) => {
			if (icon.id) {
				removeIcon(toGlobalIconId(icon.id));
			}
		});
	}

	isEnabled(): boolean {
		return true;
	}
}
