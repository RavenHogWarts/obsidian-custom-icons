import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { useIconFavorites } from "@src/hooks/useIconFavorites";
import { useIconGridDensity } from "@src/hooks/useIconGridDensity";
import { useLibShortcuts } from "@src/hooks/useLibShortcuts";
import { LL } from "@src/i18n/i18n";
import { compactGridMetrics } from "@src/util/iconGridDensity";
import { IconRef } from "@src/util/iconRef";
import { InstallOptions } from "@src/service/icon-packs/IconPackService";
import IconPackStore, {
	ICollectionInfo,
} from "@src/service/icon-packs/IconPackStore";
import {
	INpmSvgPreset,
	NPM_SVG_PRESETS,
} from "@src/service/icon-packs/sources/presets";
import { packIconId } from "@src/service/icon-packs/types";
import { IIconPackManifest, IconSourceConfig } from "@src/types/types";
import {
	ArrowLeft,
	ChevronRight,
	DownloadCloud,
	Eye,
	Globe,
	Layers,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { Notice } from "obsidian";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconCard } from "../icon-card/IconCard";
import { ConfirmDialog } from "../modal/ConfirmDialog";
import { DensityToggle } from "./DensityToggle";
import { FavoriteStrip } from "./FavoriteStrip";
import { LibEmptyState, LibGridSkeleton } from "./LibEmptyState";
import { LibHandoff } from "./libNav";
import { NpmSvgForm } from "./NpmSvgForm";
import { SvgGlyph } from "./SvgGlyph";
import { VirtualIconGrid } from "./VirtualIconGrid";
import "./IconLib.css";

/** 大包确认阈值：超过该图标数时在确认弹窗中附加提示 */
const BIG_PACK_THRESHOLD = 3000;

/** npm 预设 → 安装配置（卡片预览与安装动作共用同一 glob 语义） */
const presetToConfig = (preset: INpmSvgPreset): IconSourceConfig => ({
	type: "npm-svg",
	package: preset.package,
	version: "",
	glob: preset.glob,
});

/**
 * 可折叠区块：点击标题栏展开/收起内容。
 * 标题栏由左侧箭头 + 图标 + 标题 + 可选尾部（计数/状态徽标）组成。
 */
const CollapsibleSection: React.FC<{
	icon: React.ReactNode;
	title: React.ReactNode;
	trailing?: React.ReactNode;
	defaultOpen?: boolean;
	children: React.ReactNode;
}> = ({ icon, title, trailing, defaultOpen = true, children }) => {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div className="ci-pack__section">
			<div
				className="ci-pack__section-title"
				aria-expanded={open}
				onClick={() => setOpen((v) => !v)}
			>
				<ChevronRight
					className={`svg-icon ci-pack__section-chevron${open ? " is-open" : ""}`}
				/>
				{icon}
				<span className="ci-pack__section-label">{title}</span>
				{trailing}
			</div>
			{open && children}
		</div>
	);
};

interface PackLibProps {
	/** 从「全部」页交接过来的查询词与目标图标包（有 packId 时直接进包详情） */
	handoff?: LibHandoff;
}

export const PackLib: React.FC<PackLibProps> = ({ handoff }) => {
	const store = useSettingsStore();
	const settings = usePluginSettings(store);
	const service = store.plugin.iconPackService;

	// Local State
	const [searchQuery, setSearchQuery] = useState("");
	// 交接指定了图标包时直接落到该包的详情页（否则停在目录，用户还要自己找一遍）
	const [browsing, setBrowsing] = useState<IIconPackManifest | null>(
		() =>
			(handoff?.packId
				? settings.customIconLib.packs[handoff.packId]
				: null) ?? null,
	);
	const [installing, setInstalling] = useState(false);
	const [catalog, setCatalog] = useState<ICollectionInfo[] | null>(null);
	const [catalogMeta, setCatalogMeta] = useState<{
		fromCache: boolean;
		fetchedAt: number;
	} | null>(null);
	const [catalogError, setCatalogError] = useState<string | null>(null);

	// 目录加载（带落盘缓存，断网时展示缓存快照）
	const loadCatalog = async (force = false) => {
		if (installing) {
			return;
		}
		setCatalogError(null);
		try {
			const result = await service.getIconifyCatalog(force);
			setCatalog(result.collections);
			setCatalogMeta({
				fromCache: result.fromCache,
				fetchedAt: result.fetchedAt,
			});
		} catch (error) {
			console.error("Failed to load icon catalog:", error);
			setCatalog(null);
			setCatalogError(
				error instanceof Error ? error.message : String(error),
			);
		}
	};

	useEffect(() => {
		void loadCatalog(false);
	}, []);

	// 已安装包（按安装时间倒序）
	const installedPacks = useMemo(
		() =>
			Object.values(settings.customIconLib.packs).sort(
				(a, b) => b.installedAt - a.installedAt,
			),
		[settings.customIconLib.packs],
	);

	// 目录搜索过滤
	const filteredCatalog = useMemo(() => {
		if (!catalog) {
			return [];
		}
		const query = searchQuery.toLowerCase();
		return catalog.filter(
			(info) =>
				!query ||
				info.name.toLowerCase().includes(query) ||
				info.prefix.toLowerCase().includes(query),
		);
	}, [catalog, searchQuery]);

	const filteredPresets = useMemo(() => {
		const query = searchQuery.toLowerCase();
		return NPM_SVG_PRESETS.filter(
			(preset) =>
				!query ||
				preset.name.toLowerCase().includes(query) ||
				preset.id.toLowerCase().includes(query),
		);
	}, [searchQuery]);

	// 安装执行（网络只在此处发生，离线不变式 O1）
	const doInstall = async (
		config: IconSourceConfig,
		options: InstallOptions,
	) => {
		if (installing) {
			return;
		}
		setInstalling(true);
		const notice = new Notice(LL.view.CustomIconLib.pack.installing(), 0);
		try {
			const manifest = await service.install(config, {
				...options,
				onProgress: (done, total) => {
					notice.setMessage(
						LL.view.CustomIconLib.pack.progress({ done, total }),
					);
				},
			});
			new Notice(
				LL.view.CustomIconLib.pack.installed({
					count: manifest.iconCount,
				}),
			);
		} catch (error) {
			console.error("Failed to install icon pack:", error);
			new Notice(
				`${LL.view.CustomIconLib.pack.installFailed()}: ${error instanceof Error ? error.message : String(error)}`,
			);
		} finally {
			notice.hide();
			setInstalling(false);
		}
	};

	// Handlers（sourceEl：触发元素，弹窗挂载到其所在窗口，防跨窗口错位）
	const handleInstallIconify = (info: ICollectionInfo, sourceEl?: HTMLElement) => {
		const bigPack = (info.total ?? 0) > BIG_PACK_THRESHOLD;
		new ConfirmDialog(store.plugin, {
			title: `${LL.common.add()} "${info.name}"`,
			confirmLL: LL.common.add(),
			disableConfirm: installing,
			children: (
				<div className="ci-pack__confirm">
					<div className="ci-pack__confirm-row">
						<span>{LL.view.CustomIconLib.pack.iconCount()}</span>
						<span>{info.total ?? "?"}</span>
					</div>
					{info.license?.title && (
						<div className="ci-pack__confirm-row">
							<span>
								{LL.view.CustomIconLib.pack.licenseLabel()}
							</span>
							<span>{info.license.title}</span>
						</div>
					)}
					<div className="ci-pack__confirm-row">
						<span>{LL.view.CustomIconLib.pack.idLabel()}</span>
						<span>CI-{info.prefix}-*</span>
					</div>
					{bigPack && (
						<div className="ci-pack__confirm-warning">
							{LL.view.CustomIconLib.pack.bigPackWarning({
								count: info.total ?? 0,
							})}
						</div>
					)}
					<PackPreview
						load={() =>
							service.previewIconify(
								info.prefix,
								info.samples ?? [],
							)
						}
					/>
					<div className="ci-pack__confirm-hint">
						{LL.view.CustomIconLib.pack.offlineHint()}
					</div>
				</div>
			),
			onConfirm: () =>
				doInstall({ type: "iconify", prefix: info.prefix }, {}),
		}, { sourceEl }).open();
	};

	const handleInstallPreset = (preset: INpmSvgPreset, sourceEl?: HTMLElement) => {
		const config = presetToConfig(preset);
		new ConfirmDialog(store.plugin, {
			title: `${LL.common.add()} "${preset.name}"`,
			confirmLL: LL.common.add(),
			disableConfirm: installing,
			children: (
				<div className="ci-pack__confirm">
					<div className="ci-pack__confirm-row">
						<span>{LL.view.CustomIconLib.pack.idLabel()}</span>
						<span>CI-{preset.id}-*</span>
					</div>
					{preset.license && (
						<div className="ci-pack__confirm-row">
							<span>
								{LL.view.CustomIconLib.pack.licenseLabel()}
							</span>
							<span>{preset.license}</span>
						</div>
					)}
					<div className="ci-pack__confirm-row">
						<span>
							{LL.view.CustomIconLib.pack.sourcePackage()}
						</span>
						<span>{preset.package}</span>
					</div>
					<PackPreview
						load={() =>
							service.previewNpmSvg(presetToConfig(preset))
						}
					/>
					<div className="ci-pack__confirm-hint">
						{LL.view.CustomIconLib.pack.offlineHint()}
					</div>
				</div>
			),
			onConfirm: () =>
				doInstall(config, {
					packId: preset.id,
					name: preset.name,
					license: preset.license,
				}),
		}, { sourceEl }).open();
	};

	const handleOpenNpmForm = (sourceEl?: HTMLElement) => {
		let submitFn: (() => Promise<boolean>) | null = null;
		new ConfirmDialog(store.plugin, {
			title: LL.view.CustomIconLib.pack.npmModal.title(),
			confirmLL: LL.common.add(),
			disableConfirm: installing,
			children: (
				<NpmSvgForm
					onSubmit={(config, options) => doInstall(config, options)}
					onReady={(submit) => {
						submitFn = submit;
					}}
				/>
			),
			// 表单自行校验并逐字段解释；返回 false 时弹窗保持打开
			onConfirm: async () => (submitFn ? await submitFn() : false),
		}, { sourceEl }).open();
	};

	const handleUninstall = (manifest: IIconPackManifest, sourceEl?: HTMLElement) => {
		new ConfirmDialog(store.plugin, {
			title: `${LL.common.delete()} "${manifest.name}"?`,
			confirmLL: LL.common.delete(),
			children: (
				<div className="ci-pack__confirm">
					<div className="ci-pack__confirm-hint">
						{LL.view.CustomIconLib.pack.uninstallHint({
							count: manifest.iconCount,
						})}
					</div>
				</div>
			),
			onConfirm: async () => {
				try {
					await service.uninstall(manifest.id);
				} catch (error) {
					console.error("Failed to uninstall icon pack:", error);
					new Notice(LL.view.CustomIconLib.pack.uninstallFailed());
				}
			},
		}, { sourceEl }).open();
	};

	const handleRedownload = (
		manifest: IIconPackManifest,
		sourceEl?: HTMLElement,
	) => {
		new ConfirmDialog(store.plugin, {
			title: `${LL.view.CustomIconLib.pack.redownload()} "${manifest.name}"?`,
			confirmLL: LL.view.CustomIconLib.pack.redownload(),
			disableConfirm: installing,
			children: (
				<div className="ci-pack__confirm">
					<div className="ci-pack__confirm-row">
						<span>{LL.view.CustomIconLib.pack.iconCount()}</span>
						<span>{manifest.iconCount}</span>
					</div>
					{manifest.version && (
						<div className="ci-pack__confirm-row">
							<span>
								{LL.view.CustomIconLib.pack.versionLabel()}
							</span>
							<span>v{manifest.version}</span>
						</div>
					)}
					<div className="ci-pack__confirm-hint">
						{LL.view.CustomIconLib.pack.redownloadHint()}
					</div>
				</div>
			),
			onConfirm: () =>
				doInstall(manifest.source, {
					packId: manifest.id,
					name: manifest.name,
					license: manifest.license,
				}),
		}, { sourceEl }).open();
	};

	const handleToggleEnabled = async (
		manifest: IIconPackManifest,
		enabled: boolean,
	) => {
		try {
			await service.setEnabled(manifest.id, enabled);
		} catch (error) {
			console.error("Failed to toggle icon pack:", error);
		}
	};

	// 包详情视图
	if (browsing) {
		return (
			<PackDetail
				manifest={browsing}
				iconPackStore={store.plugin.iconPackStore}
				initialQuery={
					handoff?.packId === browsing.id ? handoff.query : ""
				}
				onBack={() => setBrowsing(null)}
			/>
		);
	}

	// 目录视图
	const searchEmpty = (
		<LibEmptyState
			title={LL.view.CustomIconLib.empty.noResults({
				query: searchQuery,
			})}
			actions={[
				{
					label: LL.view.CustomIconLib.empty.clearSearch(),
					onClick: () => setSearchQuery(""),
				},
			]}
		/>
	);

	return (
		<div className="ci-lib-container">
			{/* Toolbar */}
			<div className="ci-lib__toolbar">
				<div className="ci-lib__search">
					<input
						type="search"
						placeholder={LL.view.CustomIconLib.searchPlaceholder()}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<button
					onClick={() => void loadCatalog(true)}
					disabled={installing}
					aria-label={LL.view.CustomIconLib.pack.refreshTooltip()}
					title={LL.view.CustomIconLib.pack.refreshTooltip()}
				>
					<RefreshCw className="svg-icon" />
				</button>
				<button
					onClick={(e) => handleOpenNpmForm(e.currentTarget)}
					disabled={installing}
					aria-label={LL.view.CustomIconLib.pack.npmModal.title()}
					title={LL.view.CustomIconLib.pack.npmModal.title()}
				>
					<Globe className="svg-icon" />
				</button>
			</div>

			{/* 单一滚动体：三个区块自然排列，避免多级滚动导致内容被裁切 */}
			<div className="ci-pack__body">
				{/* Installed packs */}
				<CollapsibleSection
					icon={<Layers className="svg-icon" />}
					title={LL.view.CustomIconLib.pack.installedSection()}
					trailing={
						<span className="ci-pack__section-count">
							{installedPacks.length}
						</span>
					}
				>
					{installedPacks.length === 0 ? (
						<div className="ci-pack__empty">
							{LL.view.CustomIconLib.pack.noPacksInstalled()}
						</div>
					) : (
						<div className="ci-pack__list">
							{installedPacks.map((manifest) => (
								<div
									key={manifest.id}
									className="ci-pack__item"
								>
									<div className="ci-pack__item-main">
										<button
											className="ci-pack__item-name clickable-icon"
											onClick={() =>
												setBrowsing(manifest)
											}
											title={LL.view.CustomIconLib.pack.browseTooltip()}
										>
											{manifest.name}
										</button>
										<span className="ci-pack__item-meta">
											{LL.view.CustomIconLib.pack.iconCountLabel(
												{
													count: manifest.iconCount,
												},
											)}
											{manifest.version
												? ` · v${manifest.version}`
												: ""}
										</span>
									</div>
									<div className="ci-pack__item-actions">
										<input
											type="checkbox"
											checked={manifest.enabled}
											onChange={(e) =>
												void handleToggleEnabled(
													manifest,
													e.target.checked,
												)
											}
											aria-label={LL.view.CustomIconLib.pack.enabledTooltip()}
										/>
										<button
											className="clickable-icon"
											onClick={() =>
												setBrowsing(manifest)
											}
											aria-label={LL.view.CustomIconLib.pack.browseTooltip()}
											title={LL.view.CustomIconLib.pack.browseTooltip()}
										>
											<Eye className="svg-icon" />
										</button>
										<button
											className="clickable-icon"
											onClick={(e) =>
												handleRedownload(
													manifest,
													e.currentTarget,
												)
											}
											disabled={installing}
											aria-label={LL.view.CustomIconLib.pack.redownloadTooltip()}
											title={LL.view.CustomIconLib.pack.redownloadTooltip()}
										>
											<DownloadCloud className="svg-icon" />
										</button>
										<button
											className="clickable-icon"
											onClick={(e) =>
												handleUninstall(manifest, e.currentTarget)
											}
											aria-label={LL.common.delete()}
											title={LL.common.delete()}
										>
											<Trash2 className="svg-icon" />
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</CollapsibleSection>

				{/* Iconify catalog */}
				<CollapsibleSection
					icon={<Globe className="svg-icon" />}
					title={LL.view.CustomIconLib.pack.catalogSection()}
					defaultOpen={false}
					trailing={
						catalogMeta && (
							<span
								className="ci-pack__section-meta"
								title={LL.view.CustomIconLib.pack.cachedAt({
									time: new Date(
										catalogMeta.fetchedAt,
									).toLocaleString(),
								})}
							>
								{catalogMeta.fromCache
									? LL.view.CustomIconLib.pack.catalogCached()
									: LL.view.CustomIconLib.pack.catalogOnline()}
							</span>
						)
					}
				>
					{catalogError ? (
						<div className="ci-pack__empty ci-pack__empty--error">
							{LL.view.CustomIconLib.pack.catalogLoadFailed()}
							<div className="ci-pack__error-detail">
								{catalogError}
							</div>
						</div>
					) : !catalog ? (
						<div className="ci-pack__empty">
							{LL.view.CustomIconLib.pack.catalogLoading()}
						</div>
					) : filteredCatalog.length === 0 ? (
						searchEmpty
					) : (
							<div className="ci-pack__grid">
								{filteredCatalog.map((info) => {
									const installed = Boolean(
										settings.customIconLib.packs[info.prefix],
									);
									const samples = info.samples ?? [];
									return (
									<div
										key={info.prefix}
										className={`ci-pack__card${installing ? " is-disabled" : ""}${
											installed ? " is-installed" : ""
										}`}
										role="button"
										tabIndex={0}
										aria-disabled={installing}
										onClick={(e) => {
											if (!installing) {
												handleInstallIconify(info, e.currentTarget);
											}
										}}
										onKeyDown={(e) => {
											if (
												e.key === "Enter" ||
												e.key === " "
											) {
												e.preventDefault();
												if (!installing) {
													handleInstallIconify(info, e.currentTarget);
												}
											}
										}}
									>
										<span className="ci-pack__card-name">
											{info.name}
										</span>
										<span className="ci-pack__card-meta">
											{installed
												? LL.view.CustomIconLib.pack.alreadyInstalled()
												: info.total !== undefined
													? LL.view.CustomIconLib.pack.iconCountLabel(
															{
																count: info.total,
															},
														)
													: info.prefix}
										</span>
										{samples.length > 0 && (
											<CardSamples
												cacheKey={info.prefix}
												placeholderCount={Math.min(
													samples.length,
													8,
												)}
												load={() =>
													service.previewIconify(
														info.prefix,
														samples,
													)
												}
											/>
										)}
									</div>
								);
							})}
						</div>
					)}
				</CollapsibleSection>

				{/* npm presets */}
				<CollapsibleSection
					icon={<Globe className="svg-icon" />}
					title={LL.view.CustomIconLib.pack.presetsSection()}
					defaultOpen={false}
				>
					{filteredPresets.length === 0 ? (
						searchEmpty
					) : (
						<div className="ci-pack__grid">
							{filteredPresets.map((preset) => {
							const installed = Boolean(
								settings.customIconLib.packs[preset.id],
							);
							return (
								<div
									key={preset.id}
									className={`ci-pack__card${installing ? " is-disabled" : ""}${
										installed ? " is-installed" : ""
									}`}
									onClick={(e) => handleInstallPreset(preset, e.currentTarget)}
								>
								<span className="ci-pack__card-name">
									{preset.name}
								</span>
								<span className="ci-pack__card-meta">
									{installed
										? LL.view.CustomIconLib.pack.alreadyInstalled()
										: (preset.license ?? preset.package)}
								</span>
										<CardSamples
											cacheKey={`npm:${preset.id}`}
											load={() =>
												service.previewNpmSvg(
													presetToConfig(preset),
												)
											}
										/>
									</div>
							);
						})}
						</div>
					)}
				</CollapsibleSection>
			</div>
		</div>
	);
};

/* ------------------------------------------------------------------ */

/** 包详情：本地浏览已安装包的全部图标（纯离线读取） */
const PackDetail: React.FC<{
	manifest: IIconPackManifest;
	iconPackStore: IconPackStore;
	/** 从「全部」页交接过来的查询词 */
	initialQuery?: string;
	onBack: () => void;
}> = ({ manifest, iconPackStore, initialQuery, onBack }) => {
	const [names, setNames] = useState<string[] | null>(null);
	const [searchQuery, setSearchQuery] = useState(initialQuery ?? "");
	const searchRef = useRef<HTMLInputElement>(null);
	const clearSearch = useCallback(() => setSearchQuery(""), []);
	const handleShortcuts = useLibShortcuts(searchRef, clearSearch);

	const [density, setDensity] = useIconGridDensity();
	const favorites = useIconFavorites();
	const metrics = compactGridMetrics(density);

	// 本页的收藏 = 属于该图标包的项（注册 id 以 CI-{packId}- 开头）
	const packFavorites = useMemo(() => {
		const prefix = `${packIconId(manifest.id, "")}`;
		return favorites.refs.filter(
			(ref) => ref.type === "svg" && ref.id.startsWith(prefix),
		);
	}, [favorites.refs, manifest.id]);

	const handleToggleFavorite = useCallback(
		(id: string) => void favorites.toggle({ type: "svg", id }),
		[favorites.toggle],
	);
	const handleToggleFavoriteRef = useCallback(
		(ref: IconRef) => void favorites.toggle(ref),
		[favorites.toggle],
	);

	useEffect(() => {
		void (async () => {
			const pack = await iconPackStore.readPack(manifest.id);
			setNames(pack ? Object.keys(pack.icons).sort() : []);
		})();
	}, [manifest.id, iconPackStore]);

	const filteredNames = useMemo(() => {
		const query = searchQuery.toLowerCase();
		return (names ?? []).filter(
			(name) => !query || name.toLowerCase().includes(query),
		);
	}, [names, searchQuery]);

	// 加载中 → 骨架；已加载但过滤为空 → 无结果；包本身为空 → 0 个图标
	const detailEmptyState =
		names === null ? (
			<LibGridSkeleton
				label={LL.view.CustomIconLib.pack.detailLoading()}
			/>
		) : searchQuery ? (
			<LibEmptyState
				title={LL.view.CustomIconLib.empty.noResults({
					query: searchQuery,
				})}
				actions={[
					{
						label: LL.view.CustomIconLib.empty.clearSearch(),
						onClick: () => setSearchQuery(""),
					},
				]}
			/>
		) : (
			<LibEmptyState
				title={LL.view.CustomIconLib.pack.iconCountLabel({ count: 0 })}
			/>
		);

	return (
		<div
			className="ci-lib-container"
			tabIndex={-1}
			onKeyDown={handleShortcuts}
		>
			<div className="ci-lib__toolbar">
				<button
					className="clickable-icon"
					onClick={onBack}
					aria-label={LL.view.CustomIconLib.pack.backTooltip()}
					title={LL.view.CustomIconLib.pack.backTooltip()}
				>
					<ArrowLeft className="svg-icon" />
				</button>
				<div className="ci-lib__search">
					<input
						ref={searchRef}
						type="search"
						placeholder={LL.view.CustomIconLib.searchPlaceholder()}
						title={LL.view.CustomIconLib.searchHint()}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<DensityToggle value={density} onChange={setDensity} />
			</div>

			<div className="ci-lib__hint">
				<span className="ci-lib__hint-count">
					{manifest.name} ·{" "}
					{names === null
						? LL.view.CustomIconLib.pack.detailLoading()
						: LL.view.CustomIconLib.pack.iconCountLabel({
								count: filteredNames.length,
							})}
				</span>
				<span className="ci-lib__hint-desc">
					{LL.view.CustomIconLib.pack.detailHint()}
				</span>
			</div>

			{/* 收藏置顶（搜索时收起，避免与结果混淆） */}
			{!searchQuery && (
				<FavoriteStrip
					refs={packFavorites}
					onToggleFavorite={handleToggleFavoriteRef}
					minColumnWidth={metrics.minColumnWidth}
				/>
			)}

			<VirtualIconGrid
				items={names === null ? [] : filteredNames}
				getKey={(name) => name}
				renderItem={(name) => {
					const id = packIconId(manifest.id, name);
					return (
						<IconCard
							id={id}
							type="svg"
							favorite={favorites.isFavorite({
								type: "svg",
								id,
							})}
							onToggleFavorite={handleToggleFavorite}
						/>
					);
				}}
				minColumnWidth={metrics.minColumnWidth}
				estimateRowHeight={metrics.estimateRowHeight}
				className="ci-vgrid--compact"
				emptyState={detailEmptyState}
			/>
		</div>
	);
};

/* ------------------------------------------------------------------ */

/** 卡片内联样例的会话级缓存：cacheKey → 名称 → 已 sanitize 的 SVG（避免重复请求） */
const cardSampleCache = new Map<string, Record<string, string>>();

/**
 * 卡片内联样例（Iconify 目录卡与 npm 预设卡共用）：
 * 滚动进入视口时才懒加载（IntersectionObserver + 100px 预取边距），结果进内存缓存。
 * 区块默认折叠 → 未展开时零网络请求；失败静默退化为纯文本卡片。
 */
const CardSamples: React.FC<{
	/** 会话级缓存键（iconify 用 prefix，npm 预设加 npm: 前缀避免撞名） */
	cacheKey: string;
	/** 拉取样例（返回 名称 → 已 sanitize 的 SVG） */
	load: () => Promise<Record<string, string>>;
	/** 加载占位块数量（默认 8） */
	placeholderCount?: number;
}> = ({ cacheKey, load, placeholderCount = 8 }) => {
	const [icons, setIcons] = useState<Record<string, string> | null>(
		cardSampleCache.get(cacheKey) ?? null,
	);
	const ref = useRef<HTMLDivElement>(null);

	// load 是调用点的内联箭头（每次渲染新引用），经 ref 中转避免效应反复触发
	const loadRef = useRef(load);
	useEffect(() => {
		loadRef.current = load;
	});

	useEffect(() => {
		const el = ref.current;
		if (!el || icons) {
			return;
		}

		let cancelled = false;
		const io = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) {
					return;
				}
				io.disconnect();

				// 同屏多卡可能已由其他实例拉取过，双重检查缓存
				const cached = cardSampleCache.get(cacheKey);
				if (cached) {
					setIcons(cached);
					return;
				}

				loadRef
					.current()
					.then((result) => {
						if (cancelled) {
							return;
						}
						cardSampleCache.set(cacheKey, result);
						setIcons(result);
					})
					.catch(() => {
						// 预览失败静默处理，卡片保持纯文本
					});
			},
			{ rootMargin: "100px" },
		);

		io.observe(el);
		return () => {
			cancelled = true;
			io.disconnect();
		};
	}, [cacheKey, icons]);

	const shown: Array<[string, string]> = icons
		? Object.entries(icons).slice(0, 8)
		: Array.from({ length: placeholderCount }, (_, i): [string, string] => [
				`${cacheKey}#${i}`,
				"",
			]);

	return (
		<div className="ci-pack__card-samples" ref={ref} aria-hidden="true">
			{shown.map(([name, svg]) =>
				icons ? (
					<SvgGlyph
						key={name}
						svg={svg}
						className="ci-pack__card-sample"
					/>
				) : (
					<span
						key={name}
						className="ci-pack__card-sample ci-pack__card-sample--skeleton"
					/>
				),
			)}
		</div>
	);
};

/* ------------------------------------------------------------------ */

/** 单个预览图标 tile：SVG 字符串经解析后以节点方式注入（内容已过 sanitize） */
const PreviewIcon: React.FC<{ svg: string; name: string }> = ({
	svg,
	name,
}) => (
	<div className="ci-pack__preview-tile" title={name}>
		<SvgGlyph svg={svg} className="ci-pack__preview-svg" />
		<span className="ci-pack__preview-name">{name}</span>
	</div>
);

/** 下载前预览：懒加载样例图标（加载中/失败/无样例/就绪四态） */
export const PackPreview: React.FC<{
	load: () => Promise<Record<string, string>>;
}> = ({ load }) => {
	const [status, setStatus] = useState<
		"loading" | "ready" | "empty" | "error"
	>("loading");
	const [icons, setIcons] = useState<Record<string, string>>({});
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setStatus("loading");
		load()
			.then((result) => {
				if (cancelled) {
					return;
				}
				setIcons(result);
				setStatus(Object.keys(result).length ? "ready" : "empty");
			})
			.catch((e: unknown) => {
				if (cancelled) {
					return;
				}
				setError(e instanceof Error ? e.message : String(e));
				setStatus("error");
			});
		return () => {
			cancelled = true;
		};
	}, [load]);

	return (
		<div className="ci-pack__preview">
			<div className="ci-pack__preview-title">
				{LL.view.CustomIconLib.pack.previewTitle()}
			</div>
			{status === "loading" && (
				<div className="ci-pack__preview-status">
					{LL.view.CustomIconLib.pack.previewLoading()}
				</div>
			)}
			{status === "empty" && (
				<div className="ci-pack__preview-status">
					{LL.view.CustomIconLib.pack.previewEmpty()}
				</div>
			)}
			{status === "error" && (
				<div className="ci-pack__preview-status ci-pack__preview-status--error">
					{LL.view.CustomIconLib.pack.previewFailed()}
					{error && (
						<div className="ci-pack__error-detail">{error}</div>
					)}
				</div>
			)}
			{status === "ready" && (
				<div className="ci-pack__preview-grid">
					{Object.entries(icons).map(([name, svg]) => (
						<PreviewIcon key={name} svg={svg} name={name} />
					))}
				</div>
			)}
		</div>
	);
};
