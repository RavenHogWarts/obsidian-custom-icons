import { VirtualIconGrid } from "@src/components/icon-library/VirtualIconGrid";
import { useStripAutoScroll } from "@src/hooks/useStripAutoScroll";
import { LL } from "@src/i18n/i18n";
import CIPlugin from "@src/main";
import { IconType, RECENT_LIMIT } from "@src/types/types";
import {
	IconRef,
	decodeIconRefs,
	encodeIconRef,
	pushRecent,
	toggleFavorite,
} from "@src/util/iconRef";
import { buildIconExistence } from "@src/util/iconExists";
import { rankIcons } from "@src/util/iconSearch";
import { buildIconSources } from "@src/util/iconSources";
import { hasLucideIcon } from "@src/util/getLucideIcons";
import setIcon from "@src/util/setIcon";
import { Ban, Star } from "lucide-react";
import { Platform } from "obsidian";
import {
	memo,
	useCallback,
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { BaseModal, BaseModalOptions } from "../modal/BaseModal";
import "./IconPicker.css";

/** 有查询时单段渲染上限：足够翻找，又不让一次渲染无上限膨胀 */
const SEGMENT_LIMIT = 500;

/**
 * 当前高亮 tile 的固定 DOM id。
 * 只给高亮项挂 id（而不是逐项编号），搜索框的 aria-activedescendant 便可 O(1) 指向它。
 */
const ACTIVE_TILE_ID = "ci-picker-tile-active";

/** 一个候选分组（收藏 / 最近 / Lucide / 我的 SVG / 每个已启用图标包各一段） */
interface Segment {
	id: string;
	label: string;
	entries: IconRef[];
	/** 与 entries 同序的**小写**搜索键：预先归一化，避免每次按键重算 toLowerCase */
	keys: string[];
	/** 该段无候选时的引导文案 */
	emptyText: string;
}

const toSegment = (
	id: string,
	label: string,
	entries: IconRef[],
	emptyText: string,
): Segment => ({
	id,
	label,
	entries,
	keys: entries.map((entry) => entry.id.toLowerCase()),
	emptyText,
});

/**
 * 不随弹窗交互变化的分组：Lucide、用户 SVG、每个已启用图标包各一段。
 * 来源构建与「全部」页共用 `buildIconSources`，此处只补上空态文案。
 */
function buildStaticSegments(plugin: CIPlugin): Segment[] {
	const emptyText = LL.view.CustomIconLib.picker.emptySegment();
	return buildIconSources(plugin).map((source) => ({
		...source,
		emptyText,
	}));
}

interface IconTileProps {
	/** DOM id：供搜索框的 aria-activedescendant 指向当前高亮项 */
	domId?: string;
	entry: IconRef;
	color?: string;
	active: boolean;
	favorite: boolean;
	onSelect: (entry: IconRef) => void;
	onToggleFavorite: (entry: IconRef) => void;
}

/** 单个候选字形。memo + 稳定回调：滚动时只渲染进出视口的少量 tile */
const IconTile = memo(function IconTile({
	domId,
	entry,
	color,
	active,
	favorite,
	onSelect,
	onToggleFavorite,
}: IconTileProps) {
	const glyphRef = useRef<HTMLSpanElement>(null);
	const picker = LL.view.CustomIconLib.picker;

	useEffect(() => {
		if (!glyphRef.current) {
			return;
		}
		try {
			setIcon(glyphRef.current, entry.type, entry.id, {
				color,
				size: 20,
			});
		} catch (error) {
			console.error("Failed to render icon", entry.id, error);
		}
	}, [entry.type, entry.id, color]);

	return (
		<div
			id={domId}
			role="option"
			aria-selected={active}
			aria-label={entry.id}
			title={entry.id}
			className={`ci-picker__tile${active ? " is-active" : ""}`}
			onClick={() => onSelect(entry)}
		>
			<span ref={glyphRef} className="ci-picker__tile-glyph" />
			<button
				className={`ci-picker__tile-star${favorite ? " is-on" : ""}`}
				// 焦点常驻搜索框（combobox 模式），星标不参与 Tab 序；
				// 键盘用户走 Ctrl/Cmd+Enter，见底部提示条
				tabIndex={-1}
				aria-label={
					favorite ? picker.favoriteRemove() : picker.favoriteAdd()
				}
				onClick={(e) => {
					e.stopPropagation();
					onToggleFavorite(entry);
				}}
			>
				<Star className="svg-icon" />
			</button>
		</div>
	);
});

export interface IconPickerModalProps {
	value: string;
	type: IconType;
	color?: string;
	/**
	 * 是否允许在弹窗内改色。
	 *
	 * 只给「右键就地设置」这类没有独立颜色控件的入口开启；设置页每行的
	 * IconPicker 旁边已经有 Color 控件，再放一个只会变成两个真相来源。
	 */
	colorEditable?: boolean;
	/**
	 * @param color `undefined` = 未改动（调用方保留原值）；`""` = 显式清除
	 */
	onChange: (icon: string, type: IconType, color?: string) => void;
}

interface IconPickerViewProps extends IconPickerModalProps {
	plugin: CIPlugin;
	title?: string;
	onClose: () => void;
}

const IconPickerView: React.FC<IconPickerViewProps> = ({
	plugin,
	value,
	type,
	color,
	colorEditable,
	onChange,
	onClose,
}) => {
	const picker = LL.view.CustomIconLib.picker;
	const lib = plugin.settings.customIconLib;

	const inputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState("");
	// 大段检索让给渲染优先：输入不卡，结果稍后跟上（替代固定 200ms 防抖，
	// 后者会在快打字时把延迟叠加成"输入也慢、结果也慢"）
	const deferredQuery = useDeferredValue(query);
	const [favorites, setFavorites] = useState<string[]>(() => [
		...lib.favorites,
	]);
	const [columns, setColumns] = useState(1);
	const [draftColor, setDraftColor] = useState<string | undefined>(
		color?.trim() || undefined,
	);
	const [colorTouched, setColorTouched] = useState(false);

	// Lucide / 我的 SVG / 各图标包：每次打开构建一次
	const staticSegments = useMemo(() => buildStaticSegments(plugin), [plugin]);

	/**
	 * 收藏 / 最近里的键可能已经指不到任何图标（图标被删、被改名，或所属包被
	 * 卸载 / 停用 / 更新），铺出来就是一格空白，还能被方向键选中并写回设置。
	 * 这两段都先过一遍存在性判定。
	 */
	const exists = useMemo(
		() =>
			buildIconExistence({
				lib,
				getPack: (packId) => plugin.iconPackStore.getCachedPack(packId),
				hasLucide: hasLucideIcon,
			}),
		[lib, plugin],
	);

	// 收藏段随星标切换实时变化；最近段在弹窗生命周期内固定（选中即关闭）
	const recentRefs = useMemo(
		() => decodeIconRefs(lib.recent).filter(exists),
		[lib.recent, exists],
	);
	const segments = useMemo(
		() => [
			toSegment(
				"favorites",
				picker.segment.favorites(),
				decodeIconRefs(favorites).filter(exists),
				picker.emptyFavorites(),
			),
			toSegment(
				"recent",
				picker.segment.recent(),
				recentRefs,
				picker.emptyRecent(),
			),
			...staticSegments,
		],
		[favorites, recentRefs, staticSegments, picker, exists],
	);

	/**
	 * 打开时的落点（B1）：收藏 → 最近 → 当前图标所在段 → Lucide。
	 *
	 * 比方案多做一步：若当前图标就在落点段里，高亮直接停在它身上而不是第一格——
	 * 打开选择器先看到"我现在用的是哪个"，才谈得上顺手。
	 * 只在首次渲染计算，依赖故意留空。
	 */
	const landing = useMemo(() => {
		const locate = (segmentId: string) => {
			const seg = segments.find((item) => item.id === segmentId);
			if (!seg) {
				return -1;
			}
			return value
				? seg.entries.findIndex(
						(entry) => entry.type === type && entry.id === value,
					)
				: -1;
		};

		for (const segmentId of ["favorites", "recent"]) {
			const at = locate(segmentId);
			if (at >= 0) {
				return { segmentId, index: at };
			}
		}
		for (const segmentId of ["favorites", "recent"]) {
			const seg = segments.find((item) => item.id === segmentId);
			if (seg && seg.entries.length > 0) {
				return { segmentId, index: 0 };
			}
		}
		if (value) {
			for (const seg of staticSegments) {
				const at = seg.entries.findIndex(
					(entry) => entry.type === type && entry.id === value,
				);
				if (at >= 0) {
					return { segmentId: seg.id, index: at };
				}
			}
		}
		return { segmentId: "lucide", index: 0 };
	}, []);

	const [activeSegmentId, setActiveSegmentId] = useState(landing.segmentId);
	const [activeIndex, setActiveIndex] = useState(landing.index);

	const activeSegmentIndex = Math.max(
		0,
		segments.findIndex((seg) => seg.id === activeSegmentId),
	);
	const activeSegment = segments[activeSegmentIndex];

	/**
	 * 分段行会溢出：收藏 / 最近 / Lucide / 我的 SVG 之后，每个已启用图标包再占一段，
	 * 装两三个包就排不下了。Tab 键换段是主要走法（焦点常驻搜索框，不会滚到目标上），
	 * 所以必须由这里把当前段滚进可视区。
	 */
	const segmentsRef = useStripAutoScroll<HTMLDivElement>(activeSegmentId);

	// 各段命中总数：分组徽标要显示"这一段有多少个匹配"，所以全段都要统计，
	// 但只统计不取下标（limit 0），代价是一次 indexOf 扫描
	const totals = useMemo(() => {
		const trimmed = deferredQuery.trim();
		return segments.map((seg) =>
			trimmed
				? rankIcons(seg.keys, trimmed, 0).total
				: seg.entries.length,
		);
	}, [segments, deferredQuery]);

	// 只为当前段取下标并映射成候选（其余段不构造数组）
	const visible = useMemo(() => {
		const trimmed = deferredQuery.trim();
		if (!trimmed) {
			return activeSegment.entries;
		}
		const { indices } = rankIcons(
			activeSegment.keys,
			trimmed,
			SEGMENT_LIMIT,
		);
		return indices.map((index) => activeSegment.entries[index]);
	}, [activeSegment, deferredQuery]);

	// 高亮项可能因取消收藏 / 换段 / 改查询而越界
	const clampedIndex = Math.min(activeIndex, Math.max(0, visible.length - 1));
	const activeEntry = visible[clampedIndex];
	const activeKey = activeEntry ? encodeIconRef(activeEntry) : null;
	const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

	// 换查询 / 换段后高亮回到第一格；首次渲染不做（landing 已经把高亮
	// 停在当前图标上，这里若跟着跑会立刻把它冲掉）
	const settled = useRef(false);
	useEffect(() => {
		if (!settled.current) {
			settled.current = true;
			return;
		}
		setActiveIndex(0);
	}, [deferredQuery, activeSegmentId]);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const emitChange = (icon: string, iconType: IconType) => {
		onChange(
			icon,
			iconType,
			colorTouched ? (draftColor ?? "") : undefined,
		);
		onClose();
	};

	const choose = async (entry?: IconRef) => {
		if (!entry) {
			return;
		}
		// 先写「最近使用」：选中动作本来就会触发一次 saveSettings → applyAll，
		// 顺带写入没有额外代价（但绝不能放在 hover/滚动这类高频事件里）
		try {
			await plugin.settingsStore.updateSettingByPath(
				"customIconLib.recent",
				pushRecent(
					plugin.settings.customIconLib.recent,
					encodeIconRef(entry),
					RECENT_LIMIT,
				),
			);
		} catch (error) {
			console.error("Failed to record recent icon:", error);
		}
		emitChange(entry.id, entry.type);
	};

	const toggleFav = async (entry?: IconRef) => {
		if (!entry) {
			return;
		}
		const next = toggleFavorite(
			plugin.settings.customIconLib.favorites,
			encodeIconRef(entry),
		);
		setFavorites(next);
		try {
			await plugin.settingsStore.updateSettingByPath(
				"customIconLib.favorites",
				next,
			);
		} catch (error) {
			console.error("Failed to update favorite icons:", error);
		}
	};

	// 稳定回调 + 最新闭包（配合 IconTile 的 memo，滚动时不整片重渲）
	const chooseRef = useRef(choose);
	chooseRef.current = choose;
	const toggleFavRef = useRef(toggleFav);
	toggleFavRef.current = toggleFav;
	const handleSelect = useCallback((entry: IconRef) => {
		void chooseRef.current(entry);
	}, []);
	const handleToggleFavorite = useCallback((entry: IconRef) => {
		void toggleFavRef.current(entry);
	}, []);

	const moveSegment = (delta: number) => {
		const next =
			(activeSegmentIndex + delta + segments.length) % segments.length;
		setActiveSegmentId(segments[next].id);
	};

	const moveActive = (delta: number) => {
		setActiveIndex(() =>
			Math.min(Math.max(clampedIndex + delta, 0), visible.length - 1),
		);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		const mod = e.ctrlKey || e.metaKey;

		if (e.key === "Tab") {
			e.preventDefault();
			moveSegment(e.shiftKey ? -1 : 1);
			return;
		}
		if (mod && e.key === "Backspace") {
			e.preventDefault();
			emitChange("", type);
			return;
		}
		if (e.key === "Enter") {
			e.preventDefault();
			if (mod) {
				void toggleFavRef.current(activeEntry);
			} else {
				void chooseRef.current(activeEntry);
			}
			return;
		}

		// 上下键单行输入框用不到，直接接管；左右键要先让给光标移动，
		// 只有光标已经贴到相应一端时才用于网格走位
		const el = e.currentTarget;
		const caretAtStart =
			el.selectionStart === 0 && el.selectionEnd === 0;
		const caretAtEnd =
			el.selectionStart === el.value.length &&
			el.selectionEnd === el.value.length;

		let delta = 0;
		if (e.key === "ArrowDown") {
			delta = columns;
		} else if (e.key === "ArrowUp") {
			delta = -columns;
		} else if (e.key === "ArrowRight" && caretAtEnd) {
			delta = 1;
		} else if (e.key === "ArrowLeft" && caretAtStart) {
			delta = -1;
		}

		if (delta !== 0) {
			e.preventDefault();
			moveActive(delta);
		}
	};

	const modKey = Platform.isMacOS ? "⌘" : "Ctrl";
	const hints: Array<[string, string]> = [
		["↑↓←→", picker.hint.navigate()],
		["↵", picker.hint.select()],
		["Tab", picker.hint.segment()],
		[`${modKey}+↵`, picker.hint.favorite()],
		[`${modKey}+⌫`, picker.hint.clear()],
		["Esc", picker.hint.dismiss()],
	];

	const emptyState = (
		<div className="ci-picker__empty">
			{deferredQuery.trim()
				? picker.noResults({ query: deferredQuery.trim() })
				: activeSegment.emptyText}
		</div>
	);

	return (
		<div className="ci-picker">
			<input
				ref={inputRef}
				className="ci-picker__search"
				type="search"
				placeholder={picker.searchPlaceholder()}
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				onKeyDown={handleKeyDown}
				role="combobox"
				aria-expanded="true"
				aria-controls="ci-picker-grid"
				aria-activedescendant={activeKey ? ACTIVE_TILE_ID : undefined}
			/>

			<div
				ref={segmentsRef}
				className="ci-strip ci-picker__segments"
				role="tablist"
			>
				{segments.map((seg, index) => (
					<button
						key={seg.id}
						role="tab"
						aria-selected={seg.id === activeSegmentId}
						className={`ci-picker__segment${seg.id === activeSegmentId ? " is-active" : ""}`}
						title={
							deferredQuery.trim()
								? picker.matchCount({ count: totals[index] })
								: seg.label
						}
						onClick={() => setActiveSegmentId(seg.id)}
					>
						<span className="ci-picker__segment-label">
							{seg.label}
						</span>
						<span className="ci-picker__segment-count">
							{totals[index]}
						</span>
					</button>
				))}
			</div>

			<div className="ci-picker__grid" id="ci-picker-grid" role="listbox">
				<VirtualIconGrid
					items={visible}
					getKey={(entry) => encodeIconRef(entry)}
					renderItem={(entry) => {
						const key = encodeIconRef(entry);
						const active = key === activeKey;
						return (
							<IconTile
								domId={active ? ACTIVE_TILE_ID : undefined}
								entry={entry}
								color={draftColor}
								active={active}
								favorite={favoriteSet.has(key)}
								onSelect={handleSelect}
								onToggleFavorite={handleToggleFavorite}
							/>
						);
					}}
					minColumnWidth={40}
					gap={6}
					estimateRowHeight={40}
					className="ci-picker__vgrid"
					emptyState={emptyState}
					onColumnsChange={setColumns}
					scrollToIndex={clampedIndex}
				/>
			</div>

			<div className="ci-picker__footer">
				<div className="ci-picker__footer-row">
					<button onClick={() => emitChange("", type)}>
						{picker.clearIcon()}
					</button>

					{colorEditable && (
						<div className="ci-picker__color">
							<span className="ci-picker__color-label">
								{picker.colorLabel()}
							</span>
							<input
								type="color"
								value={draftColor ?? "#888888"}
								onChange={(e) => {
									setDraftColor(e.target.value);
									setColorTouched(true);
								}}
							/>
							<button
								className="clickable-icon"
								aria-label={picker.colorReset()}
								title={picker.colorReset()}
								onClick={() => {
									setDraftColor(undefined);
									setColorTouched(true);
								}}
							>
								<Ban className="svg-icon" />
							</button>
						</div>
					)}

					<span className="ci-picker__current">
						{activeEntry
							? picker.current({ id: activeEntry.id })
							: ""}
					</span>
				</div>

				<div className="ci-picker__hints">
					{hints.map(([keys, purpose]) => (
						<span key={keys} className="ci-picker__hint">
							<kbd>{keys}</kbd>
							{purpose}
						</span>
					))}
				</div>
			</div>
		</div>
	);
};

/**
 * 图标选择器弹窗。
 *
 * 取代原来的 `FuzzySuggestModal` 单列文本列表：分组（收藏 / 最近 / Lucide /
 * 我的 SVG / 每个已启用图标包）+ 虚拟化字形网格 + 分层检索 + 按当前颜色预览。
 *
 * 两处共用（与原实现一致）：
 * - React 组件 `IconPicker`（设置页）
 * - 各处理器的右键菜单「设置图标」（非 React 上下文）
 *
 * `sourceEl` 必须继续透传：`BaseModal` 靠它把弹窗挂到触发元素所在窗口，
 * 否则从 popout 窗口触发时弹窗会错误地叠到主窗口（已修问题，勿回退）。
 */
export class IconPickerModal extends BaseModal<IconPickerViewProps> {
	constructor(
		plugin: CIPlugin,
		props: IconPickerModalProps,
		options?: BaseModalOptions,
	) {
		super(
			plugin,
			IconPickerView,
			{
				...props,
				plugin,
				title: LL.view.CustomIconLib.picker.title(),
			},
			"ci-picker-modal",
			options,
		);
	}
}
