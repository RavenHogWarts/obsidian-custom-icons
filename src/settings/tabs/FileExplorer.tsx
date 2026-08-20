import { IconPicker } from "@src/components/icon-picker/IconPicker";
import {
	Color,
	ExtraButton,
	SettingGroup,
	SettingItem,
	Text,
	Toggle,
} from "@src/components/obsidian-setting";
import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { LL } from "@src/i18n/i18n";
import { IFileExplorerIconOverride, IconType } from "@src/types/types";
import { normalizeIconColor } from "@src/util/communityPluginIcon";
import { parseExtensionInput } from "@src/util/fileExplorerIcon";
import { FC, useState } from "react";

export const FileExplorer: FC = () => {
	const settingsStore = useSettingsStore();
	const settings = usePluginSettings(settingsStore);
	const fe = settings.fileExplorer;
	const [newExt, setNewExt] = useState("");
	const [newExtIcon, setNewExtIcon] = useState("");
	const [newExtType, setNewExtType] = useState<IconType>("lucide");

	// 整 map 写入：扩展名/路径键含 "." / "/"，不能拼进按 "." 分割的 updateSettingByPath
	const writeMap = async (
		mapKey: "extensions" | "folders" | "files",
		key: string,
		next?: IFileExplorerIconOverride,
	) => {
		const nextMap = { ...fe[mapKey] };
		if (next) {
			nextMap[key] = next;
		} else {
			delete nextMap[key];
		}
		await settingsStore.updateSettingByPath(
			`fileExplorer.${mapKey}`,
			nextMap,
		);
	};

	const renderOverrideRow = (
		mapKey: "extensions" | "folders" | "files",
		key: string,
		override: IFileExplorerIconOverride,
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
						app={settingsStore.app}
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

	const renderDefault = (
		field: "folderDefault" | "fileDefault",
		label: string,
		desc: string,
	) => {
		const icon = fe[field];
		return (
			<SettingItem
				name={label}
				desc={desc}
				control={
					<>
						<ExtraButton
							icon="reset"
							tooltip={LL.settings.fileExplorer[
								field
							].resetTooltip()}
							onClick={async () => {
								await settingsStore.updateSettingByPath(
									`fileExplorer.${field}`,
									{
										id: "",
										icon: "",
										type: "lucide",
										color: "",
									},
								);
							}}
						/>
						<IconPicker
							app={settingsStore.app}
							value={icon.icon}
							type={icon.type}
							color={icon.color}
							onChange={async (value, type) => {
								await settingsStore.updateSettingByPath(
									`fileExplorer.${field}.icon`,
									value,
								);
								await settingsStore.updateSettingByPath(
									`fileExplorer.${field}.type`,
									type,
								);
							}}
						/>
						<Color
							value={icon.color ?? ""}
							onChange={async (rawColor) => {
								await settingsStore.updateSettingByPath(
									`fileExplorer.${field}.color`,
									normalizeIconColor(rawColor) ?? "",
								);
							}}
						/>
					</>
				}
			/>
		);
	};

	const addExtension = async () => {
		// 批量：`.` 开头、逗号/空格分隔一次输入多个（如 `.xdb .js`），配同一图标
		const exts = parseExtensionInput(newExt);
		if (exts.length === 0) return;
		// 一次性构造整 map 写入，避免逐条异步写入相互覆盖
		const nextMap = { ...fe.extensions };
		for (const ext of exts) {
			// 已配置的扩展名不覆盖（避免二次输入同名把已选图标清空）
			if (nextMap[ext]) continue;
			nextMap[ext] = {
				id: ext,
				icon: newExtIcon,
				type: newExtType,
				color: "",
			};
		}
		await settingsStore.updateSettingByPath(
			"fileExplorer.extensions",
			nextMap,
		);
		setNewExt("");
		setNewExtIcon("");
		setNewExtType("lucide");
	};

	const folderEntries = Object.entries(fe.folders);
	const fileEntries = Object.entries(fe.files);
	const extEntries = Object.entries(fe.extensions);

	return (
		<>
			<SettingGroup>
				<SettingItem
					name={LL.settings.fileExplorer.enable.name()}
					desc={LL.settings.fileExplorer.enable.desc()}
					control={
						<Toggle
							value={fe.enable}
							onChange={async (value) => {
								await settingsStore.updateSettingByPath(
									"fileExplorer.enable",
									value,
								);
							}}
						/>
					}
				/>
				{renderDefault(
					"folderDefault",
					LL.settings.fileExplorer.folderDefault.name(),
					LL.settings.fileExplorer.folderDefault.desc(),
				)}
				{renderDefault(
					"fileDefault",
					LL.settings.fileExplorer.fileDefault.name(),
					LL.settings.fileExplorer.fileDefault.desc(),
				)}
				<SettingItem
					name={LL.settings.fileExplorer.inherit.subfolder.name()}
					desc={LL.settings.fileExplorer.inherit.subfolder.desc()}
					control={
						<Toggle
							value={fe.inherit.subfolder}
							onChange={async (value) => {
								await settingsStore.updateSettingByPath(
									"fileExplorer.inherit.subfolder",
									value,
								);
							}}
						/>
					}
				/>
				<SettingItem
					name={LL.settings.fileExplorer.inherit.file.name()}
					desc={LL.settings.fileExplorer.inherit.file.desc()}
					control={
						<Toggle
							value={fe.inherit.file}
							onChange={async (value) => {
								await settingsStore.updateSettingByPath(
									"fileExplorer.inherit.file",
									value,
								);
							}}
						/>
					}
				/>
			</SettingGroup>

			<SettingGroup title={LL.settings.fileExplorer.extensions.name()}>
				<SettingItem
					desc={LL.settings.fileExplorer.extensions.desc()}
					control={
						<>
							<Text
								value={newExt}
								placeholder={LL.settings.fileExplorer.extensions.placeholder()}
								onChange={(value) => setNewExt(value)}
							/>
							<IconPicker
								app={settingsStore.app}
								value={newExtIcon}
								type={newExtType}
								onChange={(value, type) => {
									setNewExtIcon(value);
									setNewExtType(type);
								}}
							/>
							<ExtraButton
								icon="plus"
								tooltip={LL.settings.fileExplorer.extensions.addTooltip()}
								onClick={addExtension}
							/>
						</>
					}
				/>
				{extEntries.length === 0 && (
					<SettingItem
						name={LL.settings.fileExplorer.extensions.noneFound()}
					/>
				)}
				{extEntries.map(([ext, override]) =>
					renderOverrideRow("extensions", ext, override, `.${ext}`),
				)}
			</SettingGroup>

			<SettingGroup title={LL.settings.fileExplorer.overrides.name()}>
				<SettingItem desc={LL.settings.fileExplorer.overrides.desc()} />
				{folderEntries.length === 0 && fileEntries.length === 0 && (
					<SettingItem
						name={LL.settings.fileExplorer.overrides.noneFound()}
					/>
				)}
				{folderEntries.length > 0 && (
					<SettingItem
						name={LL.settings.fileExplorer.overrides.folderSection()}
					/>
				)}
				{folderEntries.map(([path, override]) =>
					renderOverrideRow("folders", path, override, path),
				)}
				{fileEntries.length > 0 && (
					<SettingItem
						name={LL.settings.fileExplorer.overrides.fileSection()}
					/>
				)}
				{fileEntries.map(([path, override]) =>
					renderOverrideRow("files", path, override, path),
				)}
			</SettingGroup>
		</>
	);
};
