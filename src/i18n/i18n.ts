import { EN } from "./en";
import { LocalProperty } from "./types";
import { ZH } from "./zh";
import { ZHtw } from "./zh-tw";

export class Locals {

	static get(): LocalProperty {
		const lang = window.localStorage.getItem("language");
		// console.log(lang);
		switch (lang) {
			case "zh":
				return ZH;
			case "zh-TW":
				return ZHtw;
			default:
				return EN;
		}
	}
}