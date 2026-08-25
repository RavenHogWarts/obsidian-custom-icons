import { packIconId } from "@src/service/icon-packs/types";
import {
	IconRef,
	encodeIconRef,
	removeIconKeys,
	removeIconKeysByPrefix,
	renameIconKey,
} from "./iconRef";

/**
 * 这些清理函数只需要读写两份键列表 + 落盘，因此只声明这么多——
 * `SettingsStore` 与 `plugin.settingsStore` 都满足，单测也能给个假的。
 */
export interface IconRefListStore {
	readonly settings: {
		customIconLib: { recent: string[]; favorites: string[] };
	};
	updateSettingByPath<T>(path: string, value: T): Promise<void>;
}

/** `recent` / `favorites` 是同构的两份键列表，清理动作对二者一律同样处理 */
const LISTS = ["recent", "favorites"] as const;

/**
 * 对两份键列表各跑一遍 transform，仅在真的变了时写回。
 *
 * 逐项写而不是攒一次 `updateSettings`：`updateSettingByPath` 是这个仓库里
 * 单值写入的既有路径，各写一次的代价（一次 save + applyAll）只发生在删除 /
 * 改名这类人工动作上。
 */
async function reviseLists(
	store: IconRefListStore,
	transform: (keys: string[]) => string[],
): Promise<void> {
	for (const list of LISTS) {
		const current = store.settings.customIconLib[list];
		const next = transform(current);
		if (next.length !== current.length || next.some((k, i) => k !== current[i])) {
			await store.updateSettingByPath(`customIconLib.${list}`, next);
		}
	}
}

/**
 * 图标被删后，把它从「最近使用」和「收藏」里剔掉。
 *
 * 渲染期另有 `buildIconExistence` 兜底显示，这里管的是不让死键在 data.json 里
 * 越积越多——两者缺一都不够：光清理漏掉包停用的情形，光过滤则键永远不消失。
 */
export async function forgetIcons(
	store: IconRefListStore,
	refs: readonly IconRef[],
): Promise<void> {
	if (refs.length === 0) {
		return;
	}
	const drop = new Set(refs.map(encodeIconRef));
	await reviseLists(store, (keys) => removeIconKeys(keys, drop));
}

/** 卸载图标包后，剔掉它名下所有键（`svg:CI-{packId}-*`） */
export async function forgetPackIcons(
	store: IconRefListStore,
	packId: string,
): Promise<void> {
	const prefix = encodeIconRef({ type: "svg", id: packIconId(packId, "") });
	await reviseLists(store, (keys) => removeIconKeysByPrefix(keys, prefix));
}

/**
 * 图标改名后，让「最近使用」和「收藏」跟着走。
 *
 * 不迁移的话改个名就等于把收藏丢了——用户视角里那还是同一个图标。
 */
export async function renameIconInLists(
	store: IconRefListStore,
	from: IconRef,
	to: IconRef,
): Promise<void> {
	const fromKey = encodeIconRef(from);
	const toKey = encodeIconRef(to);
	if (fromKey === toKey) {
		return;
	}
	await reviseLists(store, (keys) => renameIconKey(keys, fromKey, toKey));
}
