import { Component, Debouncer } from "obsidian";

declare module "obsidian" {
	interface App {
		customCSS: CustomCSS;
	}
}

interface CustomCSS extends Component {
	enabledSnippets: Set<string>;
	requestLoadSnippets: Debouncer<[], void>;
	snippets: string[];
	getSnippetPath(snippetName: string): string;
	getSnippetsFolder(): string;
	setCssEnabledStatus(snippetName: string, enabled: boolean): void;
}
