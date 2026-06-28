import { IconPicker } from "@src/components/icon-picker/IconPicker";
import {
	Color,
	ExtraButton,
	Search,
	SettingGroup,
	SettingItem,
	Toggle,
} from "@src/components/obsidian-setting";
import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { LL } from "@src/i18n/i18n";
import { DEFAULT_SETTINGS } from "@src/types/types";
import {
	normalizeIconColor,
	resolveCommunityPluginIcon,
} from "@src/util/communityPluginIcon";
import { getRandomIcon, getUniqueRandomIcons } from "@src/util/randomIcon";
import { FC, useMemo, useState } from "react";

export const CommunityPlugin: FC = () => {
	const settingsStore = useSettingsStore();
	const settings = usePluginSettings(settingsStore);
	const [searchQuery, setSearchQuery] = useState("");
	const defaultIcon = settings.communityPlugins.default;

	const getEffectivePluginIcon = (pluginId: string) => {
		return resolveCommunityPluginIcon(
			pluginId,
			defaultIcon,
			settings.communityPlugins.data[pluginId],
		);
	};

	const updatePluginColor = async (pluginId: string, rawColor: string) => {
		const color = normalizeIconColor(rawColor);
		const defaultColor = normalizeIconColor(defaultIcon.color);
		const pluginIcon = settings.communityPlugins.data[pluginId];
		const hasIconOverride =
			pluginIcon?.icon !== undefined || pluginIcon?.type !== undefined;
		const matchesDefaultIcon =
			(pluginIcon?.icon ?? defaultIcon.icon) === defaultIcon.icon &&
			(pluginIcon?.type ?? defaultIcon.type) === defaultIcon.type;
		const inheritsDefaultColor =
			color === undefined || color === defaultColor;

		if (!pluginIcon) {
			if (inheritsDefaultColor) return;

			await settingsStore.updateSettingByPath(
				`communityPlugins.data.${pluginId}`,
				{
					id: pluginId,
					color,
				},
			);
			return;
		}

		if (inheritsDefaultColor) {
			if (!hasIconOverride || matchesDefaultIcon) {
				await settingsStore.deleteSettingByPath(
					`communityPlugins.data.${pluginId}`,
				);
				return;
			}

			await settingsStore.deleteSettingByPath(
				`communityPlugins.data.${pluginId}.color`,
			);
			return;
		}

		if (!hasIconOverride || matchesDefaultIcon) {
			await settingsStore.updateSettingByPath(
				`communityPlugins.data.${pluginId}`,
				{
					id: pluginId,
					color,
				},
			);
			return;
		}

		await settingsStore.updateSettingByPath(
			`communityPlugins.data.${pluginId}.color`,
			color,
		);
	};

	// 获取 communityPluginTabContainer 中的所有插件
	const installedPlugins = useMemo(() => {
		const communityPluginTabContainer =
			settingsStore.app.setting.communityPluginTabContainer;

		const pluginNavItems = communityPluginTabContainer.querySelectorAll(
			".vertical-tab-nav-item[data-setting-id]",
		) as NodeListOf<HTMLElement>;

		const plugins: Array<{
			id: string;
			name: string;
		}> = [];
		const seenIds = new Set<string>(); // 用于去重

		pluginNavItems.forEach((navItemEl) => {
			const pluginId = navItemEl.getAttribute("data-setting-id");
			if (!pluginId || seenIds.has(pluginId)) return; // 跳过空ID和重复ID

			// 检查是否存在原生图标（没有 custom-icon 类的）
			const nativeIcon = navItemEl.querySelector(
				".vertical-tab-nav-item-icon:not(.custom-icon)",
			);
			if (nativeIcon) return; // 如果是原生图标，跳过此插件

			const manifest = settingsStore.app.plugins.manifests[pluginId];
			if (manifest) {
				seenIds.add(pluginId); // 标记已处理
				plugins.push({
					id: pluginId,
					name: manifest.name,
				});
			}
		});

		// 按插件名称排序，确保顺序稳定
		return plugins.sort((a, b) => a.name.localeCompare(b.name));
	}, [settingsStore.app.plugins.manifests]);

	// 根据搜索查询过滤插件
	const filteredPlugins = useMemo(() => {
		if (!searchQuery.trim()) {
			return installedPlugins;
		}
		const query = searchQuery.toLowerCase();
		const filtered = installedPlugins.filter((plugin) => {
			return plugin.name.toLowerCase().includes(query);
		});
		// 过滤后仍然需要排序，确保顺序稳定
		return filtered.sort((a, b) => a.name.localeCompare(b.name));
	}, [installedPlugins, searchQuery]);

	return (
		<>
			{/* 默认图标设置 */}
			<SettingGroup>
				<SettingItem
					name={LL.settings.communityPlugin.enable.name()}
					desc={LL.settings.communityPlugin.enable.desc()}
					control={
						<>
							<Toggle
								value={settings.communityPlugins.enable}
								onChange={async (value) => {
									await settingsStore.updateSettingByPath(
										"communityPlugins.enable",
										value,
									);
								}}
							/>
						</>
					}
				/>
				<SettingItem
					name={LL.settings.communityPlugin.searchResults.name()}
					desc={LL.settings.communityPlugin.searchResults.desc()}
					control={
						<>
							<Toggle
								value={settings.communityPlugins.enableSearchResults}
								onChange={async (value) => {
									await settingsStore.updateSettingByPath(
										"communityPlugins.enableSearchResults",
										value,
									);
								}}
							/>
						</>
					}
				/>
				<SettingItem
					name={LL.settings.communityPlugin.default.name()}
					desc={LL.settings.communityPlugin.default.desc()}
					control={
						<>
							<ExtraButton
								icon="dices"
								tooltip={LL.settings.communityPlugin.default.dicesTooltip()}
								onClick={async () => {
									const randomIcon = getRandomIcon();
									if (randomIcon) {
										await settingsStore.updateSettingByPath(
											"communityPlugins.default.icon",
											randomIcon,
										);
										await settingsStore.updateSettingByPath(
											"communityPlugins.default.type",
											"lucide",
										);
									}
								}}
							/>
							<ExtraButton
								icon="reset"
								tooltip={LL.settings.communityPlugin.default.resetTooltip()}
								onClick={async () => {
									await settingsStore.updateSettingByPath(
										"communityPlugins.default",
										DEFAULT_SETTINGS.communityPlugins
											.default,
									);
								}}
							/>
							<IconPicker
								app={settingsStore.app}
								value={defaultIcon.icon}
								type={defaultIcon.type}
								color={defaultIcon.color}
								onChange={async (value, type) => {
									await settingsStore.updateSettingByPath(
										"communityPlugins.default.icon",
										value,
									);
									await settingsStore.updateSettingByPath(
										"communityPlugins.default.type",
										type,
									);
								}}
							/>
							<Color
								value={defaultIcon.color}
								onChange={async (value) => {
									await settingsStore.updateSettingByPath(
										"communityPlugins.default.color",
										normalizeIconColor(value) ?? "",
									);
								}}
							/>
						</>
					}
				/>
			</SettingGroup>

			{/* 插件列表分组 */}
			<SettingGroup title={LL.settings.communityPlugin.pluginList.name()}>
				<SettingItem
					name={
						<Search
							value={searchQuery}
							onChange={(value) => setSearchQuery(value)}
							placeholder={LL.settings.communityPlugin.search.placeholder()}
						/>
					}
					control={
						<>
							<ExtraButton
								icon="dices"
								tooltip={LL.settings.communityPlugin.search.dicesTooltip()}
								onClick={async () => {
									const count = filteredPlugins.length;
									// Generate unique random icons for the filtered plugins
									const randomIcons =
										getUniqueRandomIcons(count);

									for (let i = 0; i < count; i++) {
										const plugin = filteredPlugins[i];
										const icon = randomIcons[i];
										// We need to persist the id structure first if it doesn't exist?
										// updateSettingByPath handles object creation if path segments exist,
										// but 'data' is a Record.
										// Safest is to update id first then icon.
										await settingsStore.updateSettingByPath(
											`communityPlugins.data.${plugin.id}.id`,
											plugin.id,
										);
										await settingsStore.updateSettingByPath(
											`communityPlugins.data.${plugin.id}.icon`,
											icon,
										);
										await settingsStore.updateSettingByPath(
											`communityPlugins.data.${plugin.id}.type`,
											"lucide",
										);
									}
								}}
							/>
							<ExtraButton
								icon="reset"
								tooltip={LL.settings.communityPlugin.search.resetTooltip()}
								onClick={async () => {
									const count = filteredPlugins.length;
									for (let i = 0; i < count; i++) {
										const plugin = filteredPlugins[i];
										await settingsStore.deleteSettingByPath(
											`communityPlugins.data.${plugin.id}`,
										);
									}
								}}
							/>
						</>
					}
				/>

				{filteredPlugins.length === 0 && searchQuery.trim() && (
					<SettingItem
						name={LL.settings.communityPlugin.search.noneFound()}
					/>
				)}

				{filteredPlugins.map((plugin, index) => {
					const pluginIcon =
						settings.communityPlugins.data[plugin.id];
					const effectivePluginIcon = getEffectivePluginIcon(
						plugin.id,
					);

					return (
						<SettingItem
							key={`${plugin.id}-${index}`}
							name={plugin.name}
							desc={plugin.id}
							control={
								<>
									<ExtraButton
										icon="dices"
										tooltip={LL.settings.communityPlugin.pluginList.dicesTooltip()}
										onClick={async () => {
											const currentIcon =
												effectivePluginIcon.icon;

											const randomIcon =
												getRandomIcon(currentIcon);

											if (randomIcon) {
												await settingsStore.updateSettingByPath(
													`communityPlugins.data.${plugin.id}.id`,
													plugin.id,
												);
												await settingsStore.updateSettingByPath(
													`communityPlugins.data.${plugin.id}.icon`,
													randomIcon,
												);
												await settingsStore.updateSettingByPath(
													`communityPlugins.data.${plugin.id}.type`,
													"lucide",
												);
											}
										}}
									/>
									<ExtraButton
										icon="reset"
										tooltip={LL.settings.communityPlugin.pluginList.resetTooltip()}
										onClick={async () => {
											await settingsStore.deleteSettingByPath(
												`communityPlugins.data.${plugin.id}`,
											);
										}}
									/>
									<IconPicker
										app={settingsStore.app}
										value={effectivePluginIcon.icon}
										type={effectivePluginIcon.type}
										color={effectivePluginIcon.color}
										onChange={async (value, type) => {
											await settingsStore.updateSettingByPath(
												`communityPlugins.data.${plugin.id}.id`,
												plugin.id,
											);
											await settingsStore.updateSettingByPath(
												`communityPlugins.data.${plugin.id}.icon`,
												value,
											);
											await settingsStore.updateSettingByPath(
												`communityPlugins.data.${plugin.id}.type`,
												type,
											);
										}}
									/>
									<Color
										value={effectivePluginIcon.color}
										onChange={async (value) => {
											await updatePluginColor(
												plugin.id,
												value,
											);
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
