import { IconPicker } from "@src/components/icon-picker/IconPicker";
import {
	Color,
	Dropdown,
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
import { IconType, ITabHeaderIconOverride } from "@src/types/types";
import { normalizeIconColor } from "@src/util/communityPluginIcon";
import { buildTabKey, parseTabKey } from "@src/util/tabHeaderIcon";
import { FC, useMemo, useState } from "react";

/**
 * 核心视图类型清单（供下拉预置）。
 * 标签类型是有限小集合，设置页枚举完全可行，可作为主入口；
 * 其余/编辑器类型可通过「抓取当前标签」按钮补充。
 */
const KNOWN_VIEW_TYPES = [
	"file-explorer",
	"search",
	"bookmarks",
	"tag",
	"outline",
	"all-properties",
	"file-properties",
	"outgoing-link",
	"backlink",
	"markdown",
	"canvas",
	"graph",
	"localgraph",
	"audio",
	"image",
	"pdf",
	"video",
	"empty",
];

/** 单标签覆盖下拉候选条目（抓取自当前打开标签） */
interface IOpenTabOption {
	key: string;
	dataType: string;
	label: string;
}

export const TabHeader: FC = () => {
	const settingsStore = useSettingsStore();
	const settings = usePluginSettings(settingsStore);
	const th = settings.tabHeader;

	// 从当前打开的标签「抓取」到的额外类型（合并进下拉候选）
	const [fetchedTypes, setFetchedTypes] = useState<string[]>([]);
	const [selectedType, setSelectedType] = useState("");
	const [newIcon, setNewIcon] = useState("");
	const [newType, setNewType] = useState<IconType>("lucide");

	// 单标签覆盖：抓取到的当前打开标签（data-type + aria-label 复合键）
	const [fetchedTabs, setFetchedTabs] = useState<IOpenTabOption[]>([]);
	const [selectedTab, setSelectedTab] = useState("");
	const [tabIcon, setTabIcon] = useState("");
	const [tabIconType, setTabIconType] = useState<IconType>("lucide");
	const [tabFilter, setTabFilter] = useState("");

	// 整 map 写入：data-type 虽为连字符标识，仍与 Ribbon/文件浏览器保持一致
	const writeOverride = async (
		dataType: string,
		next?: ITabHeaderIconOverride,
	) => {
		const nextMap = { ...th.data };
		if (next) {
			nextMap[dataType] = next;
		} else {
			delete nextMap[dataType];
		}
		await settingsStore.updateSettingByPath("tabHeader.data", nextMap);
	};

	// 单标签层同样整 map 写入（复合键可含「.」，规避路径拆分）
	const writeTabOverride = async (
		tabKey: string,
		next?: ITabHeaderIconOverride,
	) => {
		const nextMap = { ...th.tabs };
		if (next) {
			nextMap[tabKey] = next;
		} else {
			delete nextMap[tabKey];
		}
		await settingsStore.updateSettingByPath("tabHeader.tabs", nextMap);
	};

	// 跨窗口收集当前打开标签（含 popout），返回主文档 + 各 popout 文档
	const getTabDocuments = (): Set<Document> => {
		const docs = new Set<Document>();
		docs.add(settingsStore.app.workspace.containerEl.doc);
		settingsStore.app.workspace.iterateAllLeaves((leaf) => {
			const doc = leaf.view.containerEl?.ownerDocument;
			if (doc) docs.add(doc);
		});
		return docs;
	};

	// 抓取类型层候选：仅 data-type，去重
	const fetchOpenTabTypes = () => {
		const types = new Set<string>();
		getTabDocuments().forEach((doc) => {
			doc.querySelectorAll<HTMLElement>(
				".workspace-tab-header[data-type]",
			).forEach((el) => {
				const t = el.dataset.type;
				if (t) types.add(t);
			});
		});
		setFetchedTypes(Array.from(types));
	};

	// 抓取单标签层候选：data-type + aria-label 复合键（无 aria-label 的标签跳过）
	const fetchOpenTabs = () => {
		const tabs = new Map<string, IOpenTabOption>();
		getTabDocuments().forEach((doc) => {
			doc.querySelectorAll<HTMLElement>(
				".workspace-tab-header[data-type]",
			).forEach((el) => {
				const dataType = el.dataset.type;
				if (!dataType) return;
				const label = (el.getAttribute("aria-label") ?? "").trim();
				const key = buildTabKey(dataType, label);
				if (key) {
					tabs.set(key, { key, dataType, label });
				}
			});
		});
		setFetchedTabs(
			Array.from(tabs.values()).sort(
				(a, b) =>
					a.dataType.localeCompare(b.dataType) ||
					a.label.localeCompare(b.label),
			),
		);
	};

	const configured = th.data;
	const configuredTabs = th.tabs;

	// 下拉候选：已知 ∪ 抓取，去重、剔除已配置项、排序
	const candidateTypes = useMemo(() => {
		const set = new Set<string>([...KNOWN_VIEW_TYPES, ...fetchedTypes]);
		return Array.from(set)
			.filter((t) => !configured[t])
			.sort();
	}, [fetchedTypes, configured]);

	// Dropdown options：首项为占位提示（空 value）
	const dropdownOptions = useMemo(() => {
		const opts: Record<string, string> = {
			"": LL.settings.tabHeader.mapping.selectType(),
		};
		candidateTypes.forEach((t) => {
			opts[t] = t;
		});
		return opts;
	}, [candidateTypes]);

	// 单标签下拉候选：抓取结果剔除已配置，显示「标签名（类型）」
	const tabDropdownOptions = useMemo(() => {
		const opts: Record<string, string> = {
			"": LL.settings.tabHeader.tabs.selectTab(),
		};
		fetchedTabs
			.filter(({ key }) => !configuredTabs[key])
			.forEach(({ key, dataType, label }) => {
				opts[key] = `${label}（${dataType}）`;
			});
		return opts;
	}, [fetchedTabs, configuredTabs]);

	/*
	 * 两个「添加」按钮的可用条件：类型 / 标签与图标都得选。
	 *
	 * 过去是回调里 `if (!selectedType || !newIcon) return;`——按下去什么都不发生、
	 * 无提示、按钮也没灰。而单标签层不按「抓取」就没有任何候选，于是
	 * 「打开设置页 → 直接点 +」是一条完全静默的死路。现在灰掉并在 tooltip 里
	 * 说缺什么。
	 */
	const canAddMapping = Boolean(selectedType && newIcon);
	const canAddTab = Boolean(selectedTab && tabIcon);

	/** 缺什么就说什么：只缺一样时不要笼统地说「请填完」 */
	const missingHint = (hasTarget: boolean, hasIcon: boolean): string => {
		if (!hasTarget && !hasIcon) {
			return LL.settings.tabHeader.addNeedsBoth();
		}
		return hasTarget
			? LL.settings.tabHeader.addNeedsIcon()
			: LL.settings.tabHeader.addNeedsTarget();
	};

	const addMapping = async () => {
		if (!canAddMapping) {
			return;
		}
		await writeOverride(selectedType, {
			id: selectedType,
			icon: newIcon,
			type: newType,
			color: "",
		});
		setSelectedType("");
		setNewIcon("");
		setNewType("lucide");
	};

	const addTabMapping = async () => {
		if (!canAddTab) {
			return;
		}
		await writeTabOverride(selectedTab, {
			id: selectedTab,
			icon: tabIcon,
			type: tabIconType,
			color: "",
		});
		setSelectedTab("");
		setTabIcon("");
		setTabIconType("lucide");
	};

	const entries = Object.entries(configured);

	/**
	 * 单标签覆盖靠「打开过的标签」累积、无上限，所以这里必须有筛选。
	 * 按**用户看到的那串字**匹配（标签名 + 类型），不只按内部复合键。
	 */
	const allTabs = Object.entries(configuredTabs);
	const tabQuery = tabFilter.trim().toLowerCase();
	const tabEntries = tabQuery
		? allTabs.filter(([key]) => {
				const parsed = parseTabKey(key);
				const label = parsed
					? `${parsed.label} ${parsed.dataType}`
					: key;
				return label.toLowerCase().includes(tabQuery);
			})
		: allTabs;

	return (
		<>
			<SettingGroup>
				<SettingItem
					name={LL.settings.tabHeader.enable.name()}
					desc={LL.settings.tabHeader.enable.desc()}
					control={
						<Toggle
							value={th.enable}
							onChange={async (value) => {
								await settingsStore.updateSettingByPath(
									"tabHeader.enable",
									value,
								);
							}}
						/>
					}
				/>
				<FeatureOffNotice enabled={th.enable} />
			</SettingGroup>

			<SettingGroup
				title={LL.settings.tabHeader.mapping.name()}
				disabled={!th.enable}
			>
				<SettingItem
					desc={LL.settings.tabHeader.mapping.desc()}
					control={
						<>
							<Dropdown
								value={selectedType}
								options={dropdownOptions}
								onChange={(value) => setSelectedType(value)}
							/>
							<IconPicker
								value={newIcon}
								type={newType}
								onChange={(value, type) => {
									setNewIcon(value);
									setNewType(type);
								}}
							/>
							<ExtraButton
								icon="plus"
								disabled={!canAddMapping}
								tooltip={
									canAddMapping
										? LL.settings.tabHeader.mapping.addTooltip()
										: missingHint(
												Boolean(selectedType),
												Boolean(newIcon),
											)
								}
								onClick={addMapping}
							/>
							<ExtraButton
								icon="refresh-cw"
								tooltip={LL.settings.tabHeader.mapping.fetchTooltip()}
								onClick={fetchOpenTabTypes}
							/>
						</>
					}
				/>
				{entries.length === 0 && (
					<SettingItem
						name={LL.settings.tabHeader.mapping.noneFound()}
					/>
				)}
				{entries.map(([dataType, override]) => {
					// 用「不使用图标」清空过的条目仍留在表里，此时颜色无处可施
					// （resolveTabHeaderIcon 要求有 icon）。灰掉并说明，不静默丢弃。
					// 删除键不跟着灰——删掉这条空条目是正当的清理动作。
					const configured = Boolean(override.icon);
					return (
						<SettingItem
							key={dataType}
							name={dataType}
							desc={
								configured ? undefined : LL.common.pickIconFirst()
							}
							control={
								<>
									<RandomIconButton
										value={override.icon ?? ""}
										type={override.type ?? "lucide"}
										onPick={async (value, type) => {
											await writeOverride(dataType, {
												id: dataType,
												icon: value,
												type,
												color: override.color ?? "",
											});
										}}
									/>
									<ExtraButton
										icon="trash-2"
										tooltip={LL.settings.tabHeader.mapping.resetTooltip()}
										onClick={async () => {
											await writeOverride(dataType);
										}}
									/>
									<IconPicker
										value={override.icon ?? ""}
										type={override.type ?? "lucide"}
										color={override.color}
										onChange={async (value, type) => {
											await writeOverride(dataType, {
												id: dataType,
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
											configured
												? undefined
												: LL.common.pickIconFirst()
										}
										onChange={async (rawColor) => {
											if (!configured) {
												return;
											}
											await writeOverride(dataType, {
												...override,
												color:
													normalizeIconColor(rawColor) ??
													"",
											});
										}}
									/>
								</>
							}
						/>
					);
				})}
			</SettingGroup>

			<SettingGroup
				title={LL.settings.tabHeader.tabs.name()}
				disabled={!th.enable}
				search={
					allTabs.length > 0
						? {
								value: tabFilter,
								placeholder:
									LL.settings.tabHeader.tabs.filterPlaceholder(),
								onChange: setTabFilter,
							}
						: undefined
				}
			>
				<SettingItem
					desc={LL.settings.tabHeader.tabs.desc()}
					control={
						<>
							<Dropdown
								value={selectedTab}
								options={tabDropdownOptions}
								onChange={(value) => setSelectedTab(value)}
							/>
							<IconPicker
								value={tabIcon}
								type={tabIconType}
								onChange={(value, type) => {
									setTabIcon(value);
									setTabIconType(type);
								}}
							/>
							<ExtraButton
								icon="plus"
								disabled={!canAddTab}
								tooltip={
									canAddTab
										? LL.settings.tabHeader.tabs.addTooltip()
										: missingHint(
												Boolean(selectedTab),
												Boolean(tabIcon),
											)
								}
								onClick={addTabMapping}
							/>
							<ExtraButton
								icon="refresh-cw"
								tooltip={LL.settings.tabHeader.tabs.fetchTooltip()}
								onClick={fetchOpenTabs}
							/>
						</>
					}
				/>
				{allTabs.length === 0 && (
					<SettingItem name={LL.settings.tabHeader.tabs.noneFound()} />
				)}
				{allTabs.length > 0 && tabEntries.length === 0 && (
					<SettingItem
						name={LL.settings.tabHeader.tabs.noneMatched()}
					/>
				)}
				{tabEntries.map(([tabKey, override]) => {
					const parsed = parseTabKey(tabKey);
					const configured = Boolean(override.icon);
					// 两种「这行有问题」分开说：键解析不出来（过去只是静默回落成
					// 裸 key，看不出它已经失效）、以及图标被清空导致颜色无处可施
					const notes = [
						parsed ? "" : LL.settings.tabHeader.tabs.invalidKey(),
						configured ? "" : LL.common.pickIconFirst(),
					].filter(Boolean);
					return (
						<SettingItem
							key={tabKey}
							name={
								parsed
									? `${parsed.label}（${parsed.dataType}）`
									: tabKey
							}
							desc={notes.join(" · ")}
							control={
								<>
									<RandomIconButton
										value={override.icon ?? ""}
										type={override.type ?? "lucide"}
										onPick={async (value, type) => {
											await writeTabOverride(tabKey, {
												id: tabKey,
												icon: value,
												type,
												color: override.color ?? "",
											});
										}}
									/>
									<ExtraButton
										icon="trash-2"
										tooltip={LL.settings.tabHeader.tabs.resetTooltip()}
										onClick={async () => {
											await writeTabOverride(tabKey);
										}}
									/>
									<IconPicker
										value={override.icon ?? ""}
										type={override.type ?? "lucide"}
										color={override.color}
										onChange={async (value, type) => {
											await writeTabOverride(tabKey, {
												id: tabKey,
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
											configured
												? undefined
												: LL.common.pickIconFirst()
										}
										onChange={async (rawColor) => {
											if (!configured) {
												return;
											}
											await writeTabOverride(tabKey, {
												...override,
												color:
													normalizeIconColor(rawColor) ??
													"",
											});
										}}
									/>
								</>
							}
						/>
					);
				})}
			</SettingGroup>
		</>
	);
};
