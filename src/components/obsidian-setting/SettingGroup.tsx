import {
	SettingContainerContext,
	SettingSlotContext,
} from "@src/context/SettingContext";
import { useSettingContainer } from "@src/hooks/useSettingContext";
import {
	SearchComponent,
	SettingGroup as ObsidianSettingGroup,
} from "obsidian";
import {
	FC,
	ReactNode,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import "./Setting.css";

export interface SettingGroupProps {
	/**
	 * Group title (displayed as a heading)
	 */
	title?: string | DocumentFragment;

	/**
	 * CSS class name
	 */
	className?: string;

	/**
	 * Children components (typically SettingItem components)
	 */
	children: ReactNode;

	/**
	 * 整组置灰且不可交互。
	 *
	 * 用于「功能总开关关掉了，下面这些配置当下不生效」——过去六个 tab 都是照常
	 * 可编辑、毫无提示，可以认真配完几十条规则却看不到任何效果，也不知道为什么。
	 *
	 * 落到 `.setting-items` 上而不是整个 `.setting-group`：组标题（以及标题里的
	 * 筛选框、批量按钮）不该跟着灰掉；真正不生效的是下面那些条目。
	 *
	 * 用 `inert` 而不只是 CSS `pointer-events: none`：后者挡得住鼠标，挡不住
	 * Tab 键聚焦与回车触发，灰着的输入框照样能改。
	 */
	disabled?: boolean;

	/**
	 * 分组标题上的筛选框，走 Obsidian 原生的 `SettingGroup.addSearch()`。
	 *
	 * 在此之前各 tab 都是把 `<Search>` 塞进某个 `SettingItem` 的 `name` 槽里假装
	 * 成一行筛选器——白占一整行，而且筛选框落在「设置项名称」那一列，位置不对。
	 * 原生 API 从 1.11.0 就提供了这个位置（与 `SettingGroup` 同版本引入，
	 * 不引入新的版本下限）。
	 */
	search?: {
		value: string;
		placeholder?: string;
		onChange: (value: string) => void;
	};

	/**
	 * 分组标题右侧的操作按钮（排序 / 骰子 / 批量清空 / 全部展开收起…）。
	 *
	 * 传 `<ExtraButton>` 即可：这里把原生标题区的容器作为 slot 提供出去，
	 * 与 `SettingItem` 的 `control` 槽同一套机制。
	 */
	actions?: ReactNode;

	/**
	 * Manual container element (overrides context)
	 */
	containerEl?: HTMLElement;
}

/**
 * SettingGroup - Wrapper for Obsidian's SettingGroup class (1.11.0+)
 *
 * Groups multiple related settings with an optional heading.
 * Uses Obsidian's native SettingGroup API which provides better styling and structure.
 *
 * Important: SettingGroup uses `addSetting(callback)` internally, but we provide
 * a React-friendly API where you can use SettingItem components as children.
 *
 * @example
 * ```tsx
 * <SettingGroup title="Appearance">
 *   <SettingItem name="Theme" control={<Dropdown />} />
 *   <SettingItem name="Font Size" control={<Slider />} />
 * </SettingGroup>
 * ```
 */
export const SettingGroup: FC<SettingGroupProps> = ({
	title,
	children,
	disabled = false,
	search,
	actions,
	containerEl: providedContainer,
	className,
}) => {
	const contextContainer = useSettingContainer();
	const parentContainer = providedContainer ?? contextContainer;

	// 生成唯一 ID 来标识这个 SettingGroup
	const groupId = useId();

	/*
	 * 只看「有没有传」而不看内容：这两个槽位的存在与否在每个调用点都是静态的
	 * （某张列表要么有筛选要么没有），而 `search` 是每次渲染新建的对象字面量，
	 * 直接进 deps 会让整个分组反复重建。
	 */
	const hasSearch = Boolean(search);
	const hasActions = Boolean(actions);

	const [settingItemsContainer, setSettingItemsContainer] =
		useState<HTMLElement | null>(null);

	// Create the SettingGroup and extract the correct container for children
	const settingGroupData = useMemo(() => {
		if (!parentContainer) {
			throw new Error(
				"SettingGroup must have a containerEl (either from context or props)",
			);
		}

		// Create the Obsidian SettingGroup directly on the parent container
		const group = new ObsidianSettingGroup(parentContainer);

		if (title) {
			group.setHeading(title);
		}

		if (className) {
			group.addClass(className);
		}

		// Important: SettingGroup creates a structure like:
		// <div class="setting-group">
		//   <div class="setting-item setting-item-heading">...</div>
		//   <div class="setting-items"></div>
		// </div>
		// We need to find the .setting-items container

		// 使用唯一 ID 标记这个 setting-group 以便精确查询
		const settingGroupEl = parentContainer.lastElementChild as HTMLElement;

		if (
			!settingGroupEl ||
			!settingGroupEl.classList.contains("setting-group")
		) {
			throw new Error("Failed to find setting-group element");
		}

		// 添加唯一标识符
		settingGroupEl.setAttribute("data-group-id", groupId);

		// Find the setting-items container inside it
		const itemsContainer =
			(settingGroupEl.querySelector(".setting-items") as HTMLElement) ??
			settingGroupEl.createDiv("setting-items");

		return { group, settingGroupEl, itemsContainer };
	}, [parentContainer, className, title, groupId]);

	/*
	 * 筛选框与操作按钮的槽位：**懒建一次，之后不再动**。
	 *
	 * 千万不要把「有没有 search / actions」放进上面那个 `useMemo` 的 deps。
	 * 调用方传的是 `extCount > 0 ? {...} : undefined` 这类条件值，第一条规则加进去
	 * 的那一刻它会 false → true；一旦它进 deps，整个 `ObsidianSettingGroup` 就会
	 * 重建，而新建的分组是 `append` 到父容器**末尾**的——于是「按扩展名」整组会
	 * 一下子跑到「单项覆盖」下面。（这个坑踩过一次，别再踩。）
	 *
	 * `addSearch` 按文档把输入框插在分组开头，所以晚一点再建位置也是对的。
	 */
	const slotsRef = useRef<{
		owner: unknown;
		search: SearchComponent | null;
		actions: HTMLElement | null;
	}>({ owner: null, search: null, actions: null });
	// 分组本身若真的重建了（容器 / 标题变了），槽位跟着作废
	if (slotsRef.current.owner !== settingGroupData) {
		slotsRef.current = {
			owner: settingGroupData,
			search: null,
			actions: null,
		};
	}
	const [, bumpSlots] = useState(0);
	useEffect(() => {
		const slots = slotsRef.current;
		let created = false;
		if (hasSearch && !slots.search) {
			settingGroupData.group.addSearch((component) => {
				slots.search = component;
			});
			created = true;
		}
		if (hasActions && !slots.actions) {
			settingGroupData.group.addExtraButton((component) => {
				// 不猜 DOM 结构：拿探路组件的父节点当槽位，再把它自己删掉
				slots.actions = component.extraSettingsEl.parentElement;
				component.extraSettingsEl.remove();
			});
			created = true;
		}
		if (created) {
			bumpSlots((n) => n + 1);
		}
	}, [settingGroupData, hasSearch, hasActions]);

	const searchComponent = slotsRef.current.search;
	const actionsSlot = slotsRef.current.actions;

	// 建好之后不再销毁，只按当下是否需要显示——销毁就意味着重建，重建就会跑位
	useEffect(() => {
		searchComponent?.containerEl.toggleClass(
			"ci-setting-slot--hidden",
			!hasSearch,
		);
		actionsSlot?.toggleClass("ci-setting-slot--hidden", !hasActions);
	}, [searchComponent, actionsSlot, hasSearch, hasActions]);

	useEffect(() => {
		// Set the correct container for children (the .setting-items div)
		setSettingItemsContainer(settingGroupData.itemsContainer);

		return () => {
			// Cleanup: remove the entire setting-group
			settingGroupData.settingGroupEl.remove();
		};
	}, [settingGroupData]);

	/*
	 * 置灰 + 真正不可交互（inert 连键盘聚焦一起挡掉）。
	 *
	 * 标题区的筛选框与操作按钮**也要一起挡住**：它们在 `.setting-items` 之外，
	 * 不跟着走的话，功能关着的时候骰子和批量清空照样能点，写出一堆当下不生效的
	 * 配置——那正是 S1 想消掉的那种「看着能操作，其实没意义」。
	 * 只有标题文字本身留着不灰，否则「为什么全灰了」连个抬头都没有。
	 */
	useEffect(() => {
		const targets = [
			settingGroupData.itemsContainer,
			actionsSlot,
			searchComponent?.containerEl ?? null,
		];
		for (const el of targets) {
			if (!el) {
				continue;
			}
			el.toggleClass("ci-setting-items--disabled", disabled);
			el.toggleAttribute("inert", disabled);
		}
	}, [settingGroupData, actionsSlot, searchComponent, disabled]);

	// 原生筛选框：回调只注册一次（与 Controls 里的做法一致，见 useStableCallback）
	const searchRef = useRef(search);
	searchRef.current = search;
	useEffect(() => {
		if (!searchComponent) {
			return;
		}
		searchComponent.onChange((value) => searchRef.current?.onChange(value));
	}, [searchComponent]);
	useEffect(() => {
		if (!searchComponent || !search) {
			return;
		}
		searchComponent.setValue(search.value);
		if (search.placeholder) {
			searchComponent.setPlaceholder(search.placeholder);
		}
	}, [searchComponent, search]);

	if (!settingItemsContainer) {
		return null;
	}

	// Provide the .setting-items container as the context for child SettingItems
	return (
		<SettingContainerContext.Provider value={settingItemsContainer}>
			{/* 标题区的操作按钮：与 SettingItem 的 control 槽同一套 slot 机制 */}
			{actions && actionsSlot && (
				<SettingSlotContext.Provider value={{ slotEl: actionsSlot }}>
					{createPortal(actions, actionsSlot)}
				</SettingSlotContext.Provider>
			)}
			{children}
		</SettingContainerContext.Provider>
	);
};
