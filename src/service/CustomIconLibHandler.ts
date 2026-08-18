import { addIcon, removeIcon } from "obsidian";
import { ICustomIconLib } from "../types/types";
import { AbstractIconHandler } from "../util/IconHandler";
import { cleanSvg } from "../util/svgUtils";

export default class CustomIconLibHandler extends AbstractIconHandler<ICustomIconLib> {
	readonly id = "customIconLib";

	apply(): void {
		const svgIcons = this.settings?.svg || [];

		svgIcons.forEach((icon) => {
			if (icon.id && icon.content) {
				const id = icon.id.startsWith("CI-")
					? icon.id
					: `CI-${icon.id}`;
				addIcon(id, cleanSvg(icon.content));
			}
		});
	}

	cleanup(): void {
		const svgIcons = this.settings?.svg || [];
		svgIcons.forEach((icon) => {
			if (icon.id) {
				const id = icon.id.startsWith("CI-")
					? icon.id
					: `CI-${icon.id}`;
				removeIcon(id);
			}
		});
	}

	isEnabled(): boolean {
		return true;
	}
}
