import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { LL } from "@src/i18n/i18n";
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
	Eye,
	Globe,
	Layers,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { Notice } from "obsidian";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconCard } from "../icon-card/IconCard";
import { ConfirmDialog } from "../modal/ConfirmDialog";
import { NpmSvgForm } from "./NpmSvgForm";
import { VirtualIconGrid } from "./VirtualIconGrid";
import "./IconLib.css";

/** 大包确认阈值：超过该图标数时在确认弹窗中附加提示 */
const BIG_PACK_THRESHOLD = 3000;

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

export const PackLib: React.FC = () => {
	const store = useSettingsStore();
	const settings = usePluginSettings(store);
	const service = store.plugin.iconPackService;

	// Local State
	const [searchQuery, setSearchQuery] = useState("");
	const [browsing, setBrowsing] = useState<IIconPackManifest | null>(null);
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

	// Handlers
	const handleInstallIconify = (info: ICollectionInfo) => {
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
		}).open();
	};

	const handleInstallPreset = (preset: INpmSvgPreset) => {
		const config: IconSourceConfig = {
			type: "npm-svg",
			package: preset.package,
			version: "",
			glob: preset.glob,
		};
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
							service.previewNpmSvg({
								type: "npm-svg",
								package: preset.package,
								version: "",
								glob: preset.glob,
							})
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
		}).open();
	};

	const handleOpenNpmForm = () => {
		let submitFn: (() => Promise<void>) | null = null;
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
			onConfirm: async () => {
				if (submitFn) {
					await submitFn();
				}
			},
		}).open();
	};

	const handleUninstall = (manifest: IIconPackManifest) => {
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
		}).open();
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
				onBack={() => setBrowsing(null)}
			/>
		);
	}

	// 目录视图
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
					onClick={handleOpenNpmForm}
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
											onClick={() =>
												handleUninstall(manifest)
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
					) : (
						<div className="ci-pack__grid">
							{filteredCatalog.map((info) => {
								const installed = Boolean(
									settings.customIconLib.packs[info.prefix],
								);
								return (
									<div
										key={info.prefix}
										className={`ci-pack__card${installing ? " is-disabled" : ""}${
											installed ? " is-installed" : ""
										}`}
										role="button"
										tabIndex={0}
										aria-disabled={installing}
										onClick={() => {
											if (!installing) {
												handleInstallIconify(info);
											}
										}}
										onKeyDown={(e) => {
											if (
												e.key === "Enter" ||
												e.key === " "
											) {
												e.preventDefault();
												if (!installing) {
													handleInstallIconify(info);
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
									onClick={() => handleInstallPreset(preset)}
								>
									<span className="ci-pack__card-name">
										{preset.name}
									</span>
									<span className="ci-pack__card-meta">
										{installed
											? LL.view.CustomIconLib.pack.alreadyInstalled()
											: (preset.license ??
												preset.package)}
									</span>
								</div>
							);
						})}
					</div>
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
	onBack: () => void;
}> = ({ manifest, iconPackStore, onBack }) => {
	const [names, setNames] = useState<string[] | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

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

	return (
		<div className="ci-lib-container">
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
						type="search"
						placeholder={LL.view.CustomIconLib.searchPlaceholder()}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			<div className="ci-lib__hint">
				<span className="ci-lib__hint-count">
					{manifest.name} ·{" "}
					{LL.view.CustomIconLib.pack.iconCountLabel({
						count: filteredNames.length,
					})}
				</span>
				<span className="ci-lib__hint-desc">
					{LL.view.CustomIconLib.pack.detailHint()}
				</span>
			</div>

			<VirtualIconGrid
				items={names === null ? [] : filteredNames}
				getKey={(name) => name}
				renderItem={(name) => (
					<IconCard id={packIconId(manifest.id, name)} type="svg" />
				)}
				minColumnWidth={92}
				estimateRowHeight={88}
				className="ci-vgrid--compact"
			/>
		</div>
	);
};

/* ------------------------------------------------------------------ */

/** 单个预览图标 tile：SVG 字符串经解析后以节点方式注入（内容已过 sanitize） */
const PreviewIcon: React.FC<{ svg: string; name: string }> = ({
	svg,
	name,
}) => {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = ref.current;
		if (!container) {
			return;
		}
		container.empty();
		try {
			const parsed = new DOMParser().parseFromString(
				svg,
				"image/svg+xml",
			);
			const el = parsed.documentElement;
			if (
				el &&
				el.tagName.toLowerCase() === "svg" &&
				container.ownerDocument
			) {
				container.appendChild(
					container.ownerDocument.importNode(el, true),
				);
			}
		} catch {
			// 单个样例解析失败时静默跳过，不影响其余预览
		}
	}, [svg]);

	return (
		<div className="ci-pack__preview-tile" title={name}>
			<div ref={ref} className="ci-pack__preview-svg" />
			<span className="ci-pack__preview-name">{name}</span>
		</div>
	);
};

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
