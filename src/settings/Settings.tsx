import { Tab, TabItem } from "@src/components/tab/Tab";
import { LL } from "@src/i18n/i18n";
import { FC } from "react";
import { Bookmarks } from "./tabs/Bookmarks";
import { CommunityPlugin } from "./tabs/CommunityPlugin";
import { Experimental } from "./tabs/Experimental";
import { FileExplorer } from "./tabs/FileExplorer";
import { Ribbon } from "./tabs/Ribbon";
import { TabHeader } from "./tabs/TabHeader";

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
			id: "file-explorer",
			title: LL.settings.fileExplorer.name(),
			content: <FileExplorer />,
		},
		{
			id: "tab-header",
			title: LL.settings.tabHeader.name(),
			content: <TabHeader />,
		},
		{
			id: "bookmarks",
			title: LL.settings.bookmarks.name(),
			content: <Bookmarks />,
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
