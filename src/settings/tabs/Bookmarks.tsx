import { IconPicker } from "@src/components/icon-picker/IconPicker";
import {
	Color,
	ExtraButton,
	FeatureOffNotice,
	RandomIconButton,
	SettingGroup,
	SettingItem,
	Toggle,
} from "@src/components/obsidian-setting";
import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { LL } from "@src/i18n/i18n";
import { BookmarkKind, IBookmarkIconOverride } from "@src/types/types";
import { BOOKMARK_KINDS } from "@src/util/bookmarkIcon";
import { normalizeIconColor } from "@src/util/communityPluginIcon";
import { FC } from "react";

/** 书签内部插件最小形态（仅用于设置页把 ctime 键回显为标题 / 类型） */
interface BmItemLike {
	ctime?: number;
	type?: string;
	title?: string;
	items?: BmItemLike[];
}
interface BmInstanceLike {
	getBookmarks?: () => BmItemLike[];
	getItemTitle?: (item: BmItemLike) => string;
}
interface AppInternalPluginsLike {
	internalPlugins?: {
		getEnabledPluginById?: (id: string) => BmInstanceLike | null;
	};
}

export const Bookmarks: FC = () => {
	const settingsStore = useSettingsStore();
	const settings = usePluginSettings(settingsStore);
	const bm = settings.bookmarks;

	// 整 map 写入：ctime / 类型键含点号风险低，但沿用整 map 写入与其它处理器一致
	const writeMap = async (
		mapKey: "items" | "types",
		key: string,
		next?: IBookmarkIconOverride,
	) => {
		const nextMap = { ...bm[mapKey] };
		if (next && next.icon) {
			nextMap[key] = next;
		} else {
			delete nextMap[key];
		}
		await settingsStore.updateSettingByPath(
			`bookmarks.${mapKey}`,
			nextMap,
		);
	};

	/**
	 * 把 ctime 键回显为「标题（类型）」。
	 *
	 * 返回 `null` 表示**书签核心插件没启用**，此时索引根本建不起来——必须与
	 * 「索引建好了但这一项查不到（书签真的被删了）」区分开。过去两者都落到
	 * 「已失效（书签不存在）」，于是插件一禁用，每一行都在撒谎。
	 */
	const buildTitleIndex = (): Record<string, string> | null => {
		const instance = (
			settingsStore.app as unknown as AppInternalPluginsLike
		).internalPlugins?.getEnabledPluginById?.("bookmarks");
		if (!instance) {
			return null;
		}
		const idx: Record<string, string> = {};
		const list = instance.getBookmarks?.() ?? [];
		const walk = (items: BmItemLike[]) => {
			items.forEach((item) => {
				if (item.ctime !== undefined) {
					const title =
						instance.getItemTitle?.(item) ?? item.title ?? "";
					idx[String(item.ctime)] = item.type
						? `${title} (${item.type})`
						: title;
				}
				if (item.items?.length) walk(item.items);
			});
		};
		walk(list);
		return idx;
	};

	const kindLabel = (kind: BookmarkKind): string =>
		LL.settings.bookmarks.types[kind]();

	const renderOverrideRow = (
		mapKey: "items" | "types",
		key: string,
		override: IBookmarkIconOverride,
		name: string,
	) => {
		/*
		 * 「这一行还没配」——类型层的 6 行默认就全是这个状态。
		 *
		 * 过去删除键照样可点（走一次整 map 落盘 + 一次 applyAll，界面毫无变化），
		 * 颜色则在回调里静默 return。两种都是「看着能按，实际什么都没发生」。
		 * 现在统一成 disabled + tooltip 说明原因：`resolveBookmarkIcon` 一律要求
		 * `hasIcon`，没有图标时颜色确实无处可施，这不是随手加的限制。
		 *
		 * 原因只放 tooltip、不放 `desc`：类型层 6 行的**默认**状态就是未配置，
		 * 逐行挂同一句话是 6 行重复的噪音，反而盖住了各行真正的信息（类型名）。
		 */
		const configured = Boolean(override.icon);
		return (
			<SettingItem
				key={`${mapKey}-${key}`}
				name={name}
				control={
					<>
						<RandomIconButton
							// 类型层的空行（还没配图标）会回落 Lucide——正是骰子最有用的场景
							value={override.icon ?? ""}
							type={override.type ?? "lucide"}
							onPick={async (value, type) => {
								await writeMap(mapKey, key, {
									id: key,
									icon: value,
									type,
									color: override.color ?? "",
								});
							}}
						/>
						<ExtraButton
							icon="trash-2"
							disabled={!configured}
							tooltip={
								configured
									? LL.common.delete()
									: LL.common.nothingToReset()
							}
							onClick={async () => {
								await writeMap(mapKey, key, undefined);
							}}
						/>
						<IconPicker
							value={override.icon ?? ""}
							type={override.type ?? "lucide"}
							color={override.color}
							onChange={async (value, type) => {
								await writeMap(mapKey, key, {
									id: key,
									icon: value,
									type,
									color: override.color ?? "",
								});
							}}
						/>
						<Color
							value={override.color ?? ""}
							disabled={!configured}
							tooltip={
								configured ? undefined : LL.common.pickIconFirst()
							}
							onChange={async (rawColor) => {
								if (!configured) {
									return;
								}
								await writeMap(mapKey, key, {
									...override,
									color: normalizeIconColor(rawColor) ?? "",
								});
							}}
						/>
					</>
				}
			/>
		);
	};

	const titleIndex = buildTitleIndex();
	const itemEntries = Object.entries(bm.items);

	return (
		<>
			<SettingGroup>
				<SettingItem
					name={LL.settings.bookmarks.enable.name()}
					desc={LL.settings.bookmarks.enable.desc()}
					control={
						<Toggle
							value={bm.enable}
							onChange={async (value) => {
								await settingsStore.updateSettingByPath(
									"bookmarks.enable",
									value,
								);
							}}
						/>
					}
				/>
				<FeatureOffNotice enabled={bm.enable} />
			</SettingGroup>

			<SettingGroup
				title={LL.settings.bookmarks.types.name()}
				disabled={!bm.enable}
			>
				<SettingItem desc={LL.settings.bookmarks.types.desc()} />
				{BOOKMARK_KINDS.map((kind) =>
					renderOverrideRow(
						"types",
						kind,
						bm.types[kind] ?? {
							id: kind,
							icon: "",
							type: "lucide",
							color: "",
						},
						kindLabel(kind),
					),
				)}
			</SettingGroup>

			<SettingGroup
				title={LL.settings.bookmarks.overrides.name()}
				disabled={!bm.enable}
			>
				<SettingItem desc={LL.settings.bookmarks.overrides.desc()} />
				{itemEntries.length === 0 && (
					<SettingItem
						name={LL.settings.bookmarks.overrides.noneFound()}
					/>
				)}
				{/*
				 * 书签核心插件没启用时，标题索引整个建不起来——这时候一行都不该
				 * 说「书签不存在」，而要说清是索引不可用。说明放在区块级而不是
				 * 逐行重复同一句话。
				 */}
				{titleIndex === null && itemEntries.length > 0 && (
					<SettingItem
						className="ci-setting-notice"
						name={LL.settings.bookmarks.overrides.coreDisabled()}
						desc={LL.settings.bookmarks.overrides.coreDisabledDesc()}
					/>
				)}
				{itemEntries.map(([key, override]) =>
					renderOverrideRow(
						"items",
						key,
						override,
						// 索引不可用时只显示裸键，不冒充「已失效」
						titleIndex === null
							? key
							: (titleIndex[key] ??
									`${key} — ${LL.settings.bookmarks.overrides.invalid()}`),
					),
				)}
			</SettingGroup>
		</>
	);
};
