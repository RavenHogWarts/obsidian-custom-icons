import { SettingContainerContext } from "@src/context/SettingContext";
import { Tabs } from "radix-ui";
import { FC, ReactNode, useEffect, useRef, useState } from "react";
import "./Tab.css";

export interface TabItem {
	id: string;
	title: string;
	content: ReactNode;
}

export interface TabProps {
	items: TabItem[];
	defaultValue?: string;
	/**
	 * 受控当前页。传入时由外部管理页签切换（程序化切页不会触发 onChange，
	 * 后者只在用户点击 trigger 时回调）。
	 */
	value?: string;
	orientation?: "horizontal" | "vertical";
	onChange?: (value: string) => void;
	className?: string;
}

export const Tab: FC<TabProps> = ({
	items,
	defaultValue,
	value,
	orientation = "horizontal",
	onChange,
	className = "",
}) => {
	const defaultTab = defaultValue || items[0]?.id;

	return (
		<Tabs.Root
			// 受控与非受控互斥：同时传 value 和 defaultValue 会被 Radix 警告
			{...(value === undefined
				? { defaultValue: defaultTab }
				: { value })}
			className={`ci-tab ${className}`}
			data-orientation={orientation}
			onValueChange={onChange}
		>
			<Tabs.List className="ci-tab__list" data-orientation={orientation}>
				{orientation === "vertical" && (
					<div className="ci-tab__resize-bar"></div>
				)}
				{items.map((item) => (
					<Tabs.Trigger
						key={item.id}
						value={item.id}
						className="ci-tab__trigger"
					>
						<span className="ci-tab__title">{item.title}</span>
					</Tabs.Trigger>
				))}
			</Tabs.List>

			<div className="ci-tab__panels">
				{items.map((item) => (
					<TabContentWrapper key={item.id} value={item.id}>
						{item.content}
					</TabContentWrapper>
				))}
			</div>
		</Tabs.Root>
	);
};

/**
 * Wrapper component that provides the tab panel element as SettingContainerContext
 */
const TabContentWrapper: FC<{ value: string; children: ReactNode }> = ({
	value,
	children,
}) => {
	const panelRef = useRef<HTMLDivElement>(null);
	const [containerEl, setContainerEl] = useState<HTMLElement | null>(null);

	useEffect(() => {
		if (panelRef.current) {
			setContainerEl(panelRef.current);
		}
	}, []);

	return (
		<Tabs.Content ref={panelRef} value={value} className="ci-tab__panel">
			{containerEl && (
				<SettingContainerContext.Provider value={containerEl}>
					{children}
				</SettingContainerContext.Provider>
			)}
		</Tabs.Content>
	);
};
