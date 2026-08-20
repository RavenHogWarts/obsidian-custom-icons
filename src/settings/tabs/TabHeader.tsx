import { IconPicker } from "@src/components/icon-picker/IconPicker";
import {
	Color,
	Dropdown,
	ExtraButton,
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

	const addMapping = async () => {
		if (!selectedType || !newIcon) return;
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
		if (!selectedTab || !tabIcon) return;
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
	const tabEntries = Object.entries(configuredTabs);

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
			</SettingGroup>

			<SettingGroup title={LL.settings.tabHeader.mapping.name()}>
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
								app={settingsStore.app}
								value={newIcon}
								type={newType}
								onChange={(value, type) => {
									setNewIcon(value);
									setNewType(type);
								}}
							/>
							<ExtraButton
								icon="plus"
								tooltip={LL.settings.tabHeader.mapping.addTooltip()}
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
				{entries.map(([dataType, override]) => (
					<SettingItem
						key={dataType}
						name={dataType}
						control={
							<>
								<ExtraButton
									icon="trash-2"
									tooltip={LL.settings.tabHeader.mapping.resetTooltip()}
									onClick={async () => {
										await writeOverride(dataType);
									}}
								/>
								<IconPicker
									app={settingsStore.app}
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
									onChange={async (rawColor) => {
										if (!override.icon || !override.type)
											return;
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
				))}
			</SettingGroup>

			<SettingGroup title={LL.settings.tabHeader.tabs.name()}>
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
								app={settingsStore.app}
								value={tabIcon}
								type={tabIconType}
								onChange={(value, type) => {
									setTabIcon(value);
									setTabIconType(type);
								}}
							/>
							<ExtraButton
								icon="plus"
								tooltip={LL.settings.tabHeader.tabs.addTooltip()}
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
				{tabEntries.length === 0 && (
					<SettingItem
						name={LL.settings.tabHeader.tabs.noneFound()}
					/>
				)}
				{tabEntries.map(([tabKey, override]) => {
					const parsed = parseTabKey(tabKey);
					return (
						<SettingItem
							key={tabKey}
							name={
								parsed
									? `${parsed.label}（${parsed.dataType}）`
									: tabKey
							}
							control={
								<>
									<ExtraButton
										icon="trash-2"
										tooltip={LL.settings.tabHeader.tabs.resetTooltip()}
										onClick={async () => {
											await writeTabOverride(tabKey);
										}}
									/>
									<IconPicker
										app={settingsStore.app}
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
										onChange={async (rawColor) => {
											if (!override.icon || !override.type)
												return;
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
