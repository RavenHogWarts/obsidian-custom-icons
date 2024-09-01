import { App } from 'obsidian';
import CustomIconsPlugin from '../main';

export default abstract class IconManager {
  protected readonly app: App;
  protected readonly Plugin: CustomIconsPlugin;
  private readonly mutationObservers = new Map<HTMLElement, MutationObserver>();


  constructor(app: App, plugin: CustomIconsPlugin) {
    this.app = app;
    this.Plugin = plugin;
  }

  protected refreshIcon(){
    
  }

  abstract refreshIcons(unloading?: boolean): void;

  protected setMutationObserver(element: HTMLElement, options: MutationObserverInit, callback: MutationCallback): MutationObserver {
		const observer = new MutationObserver(callback);
		if (this.mutationObservers.has(element)) {
			this.mutationObservers.get(element)?.disconnect();
		}
		observer.observe(element, options);
		this.mutationObservers.set(element, observer);
		return observer;
	}

  protected stopMutationObserver(element: HTMLElement): void {
		this.mutationObservers.get(element)?.disconnect();
		this.mutationObservers.delete(element);
	}

  protected stopMutationObservers(): void {
		for (const [element, observer] of this.mutationObservers) {
			observer.disconnect();
			this.mutationObservers.delete(element);
		}
	}

  unload(): void {
		this.refreshIcons(true);
		this.stopMutationObservers();
	}
}