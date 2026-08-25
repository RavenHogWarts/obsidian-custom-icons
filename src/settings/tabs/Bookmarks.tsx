import { IconPicker } from "@src/components/icon-picker/IconPicker";
import {
	Color,
	ExtraButton,
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

	// 用书签模型把 ctime 键回显为「标题（类型）」；插件禁用 / 项已删则回退
	const buildTitleIndex = (): Record<string, string> => {
		const idx: Record<string, string> = {};
		const instance = (
			settingsStore.app as unknown as AppInternalPluginsLike
		).internalPlugins?.getEnabledPluginById?.("bookmarks");
		const list = instance?.getBookmarks?.() ?? [];
		const walk = (items: BmItemLike[]) => {
			items.forEach((item) => {
				if (item.ctime !== undefined) {
					const title =
						instance?.getItemTitle?.(item) ?? item.title ?? "";
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
	) => (
		<SettingItem
			key={`${mapKey}-${key}`}
			name={name}
			control={
				<>
					<ExtraButton
						icon="trash-2"
						tooltip={LL.common.delete()}
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
						onChange={async (rawColor) => {
							if (!override.icon || !override.type) return;
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
			</SettingGroup>

			<SettingGroup title={LL.settings.bookmarks.types.name()}>
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

			<SettingGroup title={LL.settings.bookmarks.overrides.name()}>
				<SettingItem desc={LL.settings.bookmarks.overrides.desc()} />
				{itemEntries.length === 0 && (
					<SettingItem
						name={LL.settings.bookmarks.overrides.noneFound()}
					/>
				)}
				{itemEntries.map(([key, override]) =>
					renderOverrideRow(
						"items",
						key,
						override,
						titleIndex[key] ??
							`${key} — ${LL.settings.bookmarks.overrides.invalid()}`,
					),
				)}
			</SettingGroup>
		</>
	);
};
