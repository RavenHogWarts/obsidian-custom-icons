import { requestUrl } from "obsidian";

/** 网络错误：带已尝试的 URL，便于 UI 呈现 */
export class NetworkError extends Error {
	constructor(
		message: string,
		readonly urls: string[],
	) {
		super(message);
		this.name = "NetworkError";
	}
}

/** 依次尝试多个镜像 URL 拉取 JSON；全部失败抛 NetworkError */
export async function fetchJson<T>(urls: string[]): Promise<T> {
	const errors: unknown[] = [];
	for (const url of urls) {
		try {
			const res = await requestUrl({ url, method: "GET" });
			if (res.status >= 200 && res.status < 300) {
				return res.json as T;
			}
			errors.push(`${url} -> HTTP ${res.status}`);
		} catch (error) {
			errors.push(`${url} -> ${error instanceof Error ? error.message : error}`);
		}
	}
	throw new NetworkError(`All mirrors failed: ${errors.join("; ")}`, urls);
}

/** 依次尝试多个镜像 URL 拉取文本；全部失败抛 NetworkError */
export async function fetchText(urls: string[]): Promise<string> {
	const errors: unknown[] = [];
	for (const url of urls) {
		try {
			const res = await requestUrl({ url, method: "GET" });
			if (res.status >= 200 && res.status < 300) {
				return res.text;
			}
			errors.push(`${url} -> HTTP ${res.status}`);
		} catch (error) {
			errors.push(`${url} -> ${error instanceof Error ? error.message : error}`);
		}
	}
	throw new NetworkError(`All mirrors failed: ${errors.join("; ")}`, urls);
}

/** 限制并发的映射执行（npm SVG 批量抓取用） */
export async function mapWithConcurrency<T, R>(
	items: T[],
	concurrency: number,
	fn: (item: T, index: number) => Promise<R>,
	onProgress?: (done: number, total: number) => void,
	signal?: AbortSignal,
): Promise<R[]> {
	const results = new Array<R>(items.length);
	let next = 0;
	let done = 0;

	const worker = async () => {
		while (next < items.length) {
			if (signal?.aborted) {
				return;
			}
			const index = next++;
			results[index] = await fn(items[index], index);
			done++;
			onProgress?.(done, items.length);
		}
	};

	await Promise.all(
		Array.from({ length: Math.min(concurrency, items.length) }, worker),
	);
	return results;
}
