import {
	SettingGroup,
	SettingItem,
	Toggle,
} from "@src/components/obsidian-setting";
import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { LL } from "@src/i18n/i18n";
import { FC } from "react";

export const Experimental: FC = () => {
	const settingsStore = useSettingsStore();
	const settings = usePluginSettings(settingsStore);

	return (
		<SettingGroup>
			<SettingItem
				name={LL.settings.experimental.keepPluginFirst.name()}
				desc={LL.settings.experimental.keepPluginFirst.desc()}
				control={
					<Toggle
						value={settings.experimental.keepPluginFirst}
						onChange={async (value) => {
							await settingsStore.updateSettingByPath(
								"experimental.keepPluginFirst",
								value,
							);
						}}
					/>
				}
			/>
		</SettingGroup>
	);
};
