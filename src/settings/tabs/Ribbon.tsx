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
import { IRibbonIconOverride, IconType } from "@src/types/types";
import { FC, useMemo, useState } from "react";

const RIBBON_ACTION_SELECTOR =
	".workspace-ribbon.mod-left .side-dock-actions .side-dock-ribbon-action";

interface RibbonActionInfo {
	label: string;
	hasIcon: boolean;
	/** 按钮当前显示的图标（未分配时来自原生 svg 的 class） */
	currentIcon?: string;
	currentType: IconType;
}

/**
 * 从按钮现有 svg 的 class 提取图标名：
 * Obsidian 渲染的 lucide 图标带 `lucide-<name>` class，
 * addIcon 注册的自定义图标（如 BRAT 的 BratIcon）以 iconId 为 class
 */
function getCurrentIcon(
	el: Element,
): Pick<RibbonActionInfo, "currentIcon" | "currentType"> {
	const svg = el.querySelector("svg");
	if (!svg) {
		return { currentType: "lucide" };
	}
	for (const cls of Array.from(svg.classList)) {
		if (cls === "svg-icon" || cls === "lucide") continue;
		if (cls.startsWith("lucide-")) {
			return {
				currentIcon: cls.slice("lucide-".length),
				currentType: "lucide",
			};
		}
		return { currentIcon: cls, currentType: "svg" };
	}
	return { currentType: "lucide" };
}

export const Ribbon: FC = () => {
	const settingsStore = useSettingsStore();
	const settings = usePluginSettings(settingsStore);
	// 手动刷新：重新枚举 ribbon 按钮（如设置页打开期间启用了新插件）
	const [refreshTick, setRefreshTick] = useState(0);

	// 从 live DOM 枚举当前 Ribbon 按钮（设置页打开时 ribbon 必已存在）。
	// aria-label（= addRibbonIcon 的 title）是 DOM 上唯一的按钮标识
	const ribbonActions = useMemo<RibbonActionInfo[]>(() => {
		const actions: RibbonActionInfo[] = [];
		const seenLabels = new Set<string>();

		// ribbon 仅存在于主窗口，查询主窗口 document
		// （workspace.containerEl 恒在主窗口，其 .doc 即主窗口 document）
		settingsStore.app.workspace.containerEl.doc
			.querySelectorAll(RIBBON_ACTION_SELECTOR)
			.forEach((el) => {
				const label = el.getAttribute("aria-label");
				if (!label || seenLabels.has(label)) return;
				seenLabels.add(label);
				actions.push({
					label,
					hasIcon: Boolean(el.querySelector("svg")),
					...getCurrentIcon(el),
				});
			});

		// 按标签排序，确保顺序稳定
		return actions.sort((a, b) => a.label.localeCompare(b.label));
	}, [refreshTick]);

	// 整 map 写入：aria-label 可能包含 "."，
	// 不能拼进按 "." 分割路径的 updateSettingByPath
	const writeOverride = async (label: string, next?: IRibbonIconOverride) => {
		const nextData = { ...settings.ribbon.data };
		if (next) {
			nextData[label] = next;
		} else {
			delete nextData[label];
		}
		await settingsStore.updateSettingByPath("ribbon.data", nextData);
	};

	return (
		<>
			<SettingGroup>
				<SettingItem
					name={LL.settings.ribbon.enable.name()}
					desc={LL.settings.ribbon.enable.desc()}
					control={
						<Toggle
							value={settings.ribbon.enable}
							onChange={async (value) => {
								await settingsStore.updateSettingByPath(
									"ribbon.enable",
									value,
								);
							}}
						/>
					}
				/>
			</SettingGroup>

			<SettingGroup title={LL.settings.ribbon.list.name()}>
				<SettingItem
					desc={LL.settings.ribbon.list.desc()}
					control={
						<ExtraButton
							icon="refresh-cw"
							tooltip={LL.settings.ribbon.list.refreshTooltip()}
							onClick={() => setRefreshTick((tick) => tick + 1)}
						/>
					}
				/>
				{ribbonActions.length === 0 && (
					<SettingItem name={LL.settings.ribbon.list.noneFound()} />
				)}
				{ribbonActions.map((action) => {
					const override = settings.ribbon.data[action.label];
					return (
						<SettingItem
							key={action.label}
							name={action.label}
							desc={
								override
									? LL.settings.ribbon.list.customized()
									: action.hasIcon
										? LL.settings.ribbon.list.hasIcon()
										: LL.settings.ribbon.list.noIcon()
							}
							control={
								<>
									<ExtraButton
										icon="reset"
										disabled={!override}
										tooltip={LL.settings.ribbon.list.resetTooltip()}
										onClick={async () => {
											await writeOverride(action.label);
										}}
									/>
									<IconPicker
										app={settingsStore.app}
										// 未分配时显示按钮当前图标（从原生 svg class 提取）
										value={
											override?.icon ??
											action.currentIcon ??
											""
										}
										type={
											override?.type ?? action.currentType
										}
										color={override?.color}
										onChange={async (value, type) => {
											await writeOverride(action.label, {
												id: action.label,
												icon: value,
												type,
												color: override?.color ?? "",
											});
										}}
									/>
									<Color
										value={override?.color ?? ""}
										onChange={async (rawColor) => {
											if (!override) return;
											await writeOverride(action.label, {
												...override,
												color: rawColor,
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
