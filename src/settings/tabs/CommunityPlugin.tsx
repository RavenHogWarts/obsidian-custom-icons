import { IconPicker } from "@src/components/icon-picker/IconPicker";
import {
	Color,
	ExtraButton,
	FeatureOffNotice,
	RandomIconButton,
	Search,
	SettingGroup,
	SettingItem,
	Toggle,
} from "@src/components/obsidian-setting";
import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { LL } from "@src/i18n/i18n";
import {
	DEFAULT_SETTINGS,
	ICommunityPluginIconOverride,
} from "@src/types/types";
import {
	normalizeIconColor,
	resolveCommunityPluginIcon,
} from "@src/util/communityPluginIcon";
import { encodeIconRef, iconRefOf } from "@src/util/iconRef";
import { randomIconsFor } from "@src/util/randomIcon";
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

	/**
	 * 整 map 写入一条覆盖项（`next` 省略 = 删除该条）。
	 *
	 * 与其余四个设置页同一姿态。本页其它写入还走 `updateSettingByPath` 逐字段，
	 * 但骰子这条必须整 map 写：逐字段要写三次（id / icon / type），每次都是
	 * 一份设置深拷贝 + `saveSettings()` + `applyAll()`，而 `applyAll()` 在装了
	 * 大包时是上万次 `addIcon`。顺带避开插件 id 含 `.` 时被路径拆分写坏的隐患。
	 */
	const writeOverride = async (
		pluginId: string,
		next?: ICommunityPluginIconOverride,
	) => {
		const nextData = { ...settings.communityPlugins.data };
		if (next) {
			nextData[pluginId] = next;
		} else {
			delete nextData[pluginId];
		}
		await settingsStore.updateSettingByPath(
			"communityPlugins.data",
			nextData,
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

		const pluginNavItems =
			communityPluginTabContainer.querySelectorAll<HTMLElement>(
				".vertical-tab-nav-item[data-setting-id]",
			);

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

	/**
	 * 批量随机：给筛选出的每一行掷一个图标，**一次落盘**。
	 *
	 * 原实现对每行连写三次 `updateSettingByPath`，而每次都是整份设置深拷贝 →
	 * `saveSettings()` → `iconManager.applyAll()`（main.ts）。50 个插件 = 150 次
	 * 全量重注册，装了大包时那是上万次 `addIcon` × 150——用户可感的卡顿。
	 * 改为构建整份 `data` 后单写一次，与其余四个处理器的整 map 写入姿态一致，
	 * 顺带修掉插件 id 含 `.` 时被路径拆分写坏的隐患。
	 *
	 * 随机域取自**默认图标**（一批同来源）：不按各行自己的来源，否则「尽量互不
	 * 相同」跨池子无意义，各池大小不同、重复策略也难向用户解释。
	 */
	const randomizeFiltered = async () => {
		if (filteredPlugins.length === 0) {
			return;
		}
		// 排除各行当前生效的图标：尽量不把某行掷回原样（排除后无人可选时
		// sampleMany 自会退回整池，是尽力而为不是硬约束）
		const exclude = new Set<string>();
		for (const plugin of filteredPlugins) {
			const effective = getEffectivePluginIcon(plugin.id);
			const ref = iconRefOf(effective.icon, effective.type);
			if (ref) {
				exclude.add(encodeIconRef(ref));
			}
		}
		const picked = randomIconsFor(
			settingsStore.plugin,
			iconRefOf(defaultIcon.icon, defaultIcon.type),
			filteredPlugins.length,
			exclude,
		);
		// 池子空（理论上碰不到，Lucide 恒在）：什么都不写，而不是清空一片图标
		if (picked.length === 0) {
			return;
		}

		const next: Record<string, ICommunityPluginIconOverride> = {
			...settings.communityPlugins.data,
		};
		filteredPlugins.forEach((plugin, index) => {
			// sampleMany 在池子非空时恒返回 count 项（会循环复用），这里的兜底
			// 只为不依赖那个不变式——原实现按下标取就把 undefined 写进了设置
			const ref = picked[index];
			if (!ref) {
				return;
			}
			const current = next[plugin.id];
			// 与默认图标相同就不落 override：normalizeCommunityPluginOverride
			// 随后也会把它清掉，白写一轮
			if (ref.id === defaultIcon.icon && ref.type === defaultIcon.type) {
				if (current?.color) {
					next[plugin.id] = { id: plugin.id, color: current.color };
				} else {
					delete next[plugin.id];
				}
				return;
			}
			next[plugin.id] = {
				...current,
				id: plugin.id,
				icon: ref.id,
				type: ref.type,
			};
		});

		await settingsStore.updateSettingByPath("communityPlugins.data", next);
	};

	return (
		<>
			{/* 总开关 */}
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
				<FeatureOffNotice enabled={settings.communityPlugins.enable} />
			</SettingGroup>

			{/* 默认图标设置：随总开关禁用 */}
			<SettingGroup disabled={!settings.communityPlugins.enable}>
				<SettingItem
					name={LL.settings.communityPlugin.searchResults.name()}
					desc={LL.settings.communityPlugin.searchResults.desc()}
					control={
						<>
							<Toggle
								value={
									settings.communityPlugins
										.enableSearchResults
								}
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
							<RandomIconButton
								value={defaultIcon.icon}
								type={defaultIcon.type}
								onPick={async (value, type) => {
									// 一次写整个 default 而不是 icon / type 各写一次：
									// 每次写入都是一遍 saveSettings + applyAll（装了大包
									// 时是上万次 addIcon），而中间那一拍还是「新 icon 配
									// 旧 type」的错配状态，会渲染出一个不存在的图标
									await settingsStore.updateSettingByPath(
										"communityPlugins.default",
										{ ...defaultIcon, icon: value, type },
									);
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
			<SettingGroup
				title={LL.settings.communityPlugin.pluginList.name()}
				disabled={!settings.communityPlugins.enable}
			>
				{/* 分组说明行：与 ribbon.list / bookmarks.overrides 等分组一致 */}
				<SettingItem
					desc={LL.settings.communityPlugin.pluginList.desc()}
				/>
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
								onClick={randomizeFiltered}
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
									<RandomIconButton
										value={effectivePluginIcon.icon}
										type={effectivePluginIcon.type}
										onPick={async (value, type) => {
											await writeOverride(plugin.id, {
												...settings.communityPlugins
													.data[plugin.id],
												id: plugin.id,
												icon: value,
												type,
											});
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
