import { Tab, TabItem } from "@src/components/tab/Tab";
import { LL } from "@src/i18n/i18n";
import { FC } from "react";
import { CommunityPlugin } from "./tabs/CommunityPlugin";
import { Experimental } from "./tabs/Experimental";
import { Ribbon } from "./tabs/Ribbon";

export const Settings: FC = () => {
	const tabItems: TabItem[] = [
		{
			id: "community-plugin",
			title: LL.settings.communityPlugin.name(),
			content: <CommunityPlugin />,
		},
		{
			id: "ribbon",
			title: LL.settings.ribbon.name(),
			content: <Ribbon />,
		},
		{
			id: "experimental",
			title: LL.settings.experimental.name(),
			content: <Experimental />,
		},
	];

	return (
		<Tab
			items={tabItems}
			defaultValue="community-plugin"
			orientation="horizontal"
			className="NToc__settings-tabs"
		/>
	);
};
