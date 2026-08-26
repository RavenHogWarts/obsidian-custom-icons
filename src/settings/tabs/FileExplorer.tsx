import "@src/components/file-explorer/FileExplorer.css";
import { MoveExtGroup } from "@src/components/file-explorer/MoveExtGroup";
import { PresetPicker } from "@src/components/file-explorer/PresetPicker";
import { RenameExtGroup } from "@src/components/file-explorer/RenameExtGroup";
import { IconPicker } from "@src/components/icon-picker/IconPicker";
import { ConfirmDialog } from "@src/components/modal/ConfirmDialog";
import {
	Color,
	ExtraButton,
	FeatureOffNotice,
	RandomIconButton,
	Search,
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
import {
	ExtensionMap,
	assignGroup,
	deleteGroupWithRules,
	dissolveGroup,
	groupMembers,
	listGroups,
	renameGroup,
	ruleGroup,
	setGroupColor,
	setGroupIcon,
	ungroupedKeys,
	uniformIcon,
} from "@src/util/extensionGroups";
import {
	parseExtensionInput,
	tallyExtensions,
} from "@src/util/fileExplorerIcon";
import {
	PresetId,
	findPreset,
	planPreset,
} from "@src/util/fileExplorerPresets";
import { normalizeGroupName } from "@src/util/groupName";
import { encodeIconRef, iconRefOf } from "@src/util/iconRef";
import { randomIconsFor } from "@src/util/randomIcon";
import { MoreVertical } from "lucide-react";
import { Menu, Notice } from "obsidian";
import { FC, Fragment, useCallback, useMemo, useState } from "react";

/** 候选芯片最多显示几个：够用来一键补齐常见类型，又不至于铺满一屏 */
const CANDIDATE_LIMIT = 12;

/** 扩展名列表的排序方式 */
type ExtSort = "count" | "name";

export const FileExplorer: FC = () => {
	const settingsStore = useSettingsStore();
	const settings = usePluginSettings(settingsStore);
	const fe = settings.fileExplorer;
	const extLL = LL.settings.fileExplorer.extensions;
	const groupLL = LL.settings.fileExplorer.extGroup;

	const [newExt, setNewExt] = useState("");
	const [newExtIcon, setNewExtIcon] = useState("");
	const [newExtType, setNewExtType] = useState<IconType>("lucide");
	const [newExtGroup, setNewExtGroup] = useState("");
	const [extFilter, setExtFilter] = useState("");
	// 默认按文件数：库里有 200 个 png 和 1 个 xyz 时，前者才是用户来这里要配的东西
	const [extSort, setExtSort] = useState<ExtSort>("count");
	const [overrideFilter, setOverrideFilter] = useState("");

	/**
	 * 库中各扩展名的文件数，**挂载时统计一次**。
	 *
	 * 不监听 vault 事件重算：设置页开着的这几分钟里文件数变化对「配哪个图标」
	 * 没有影响，而 `getFiles()` 在大库里不便宜。数字用于排序与「库中还没配的
	 * 扩展名」候选，两者都不要求实时。
	 *
	 * 计数同时统计末段与复合后缀（`a.excalidraw.md` 同时计入 `md` 与
	 * `excalidraw.md`），所以列口径是「库中该扩展名的文件数」而非
	 * 「这条规则实际影响的文件数」——后者要模拟整条解析链，代价与收益不成比例。
	 */
	const tally = useMemo(
		() => tallyExtensions(settingsStore.app.vault.getFiles().map((f) => f.path)),
		[settingsStore.app.vault],
	);

	/** 本次渲染看到的 extensions 表（`ExtensionMap` 与它同型，不必断言） */
	const extMap: ExtensionMap = fe.extensions;

	/**
	 * 读**当前落盘**的 extensions 表。
	 *
	 * 弹窗与菜单的回调是稍后才跑的，那时闭包里的 `extMap` 可能已经过期
	 * （另一个窗口改了、或本窗口刚做过一次批量）。凡是「打开弹窗 → 确认」
	 * 这条路径上的写入，一律以这个函数为基准算下一份表。
	 */
	const liveExtMap = useCallback(
		(): ExtensionMap => settingsStore.plugin.settings.fileExplorer.extensions,
		[settingsStore],
	);

	/** 整 map 写入：扩展名/路径键含 "." / "/"，不能拼进按 "." 分割的 updateSettingByPath */
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

	/** 整张 extensions 表一次写入（分组类动作全走这里，N 行改动 = 一次 applyAll） */
	const writeExtensions = async (next: ExtensionMap) => {
		await settingsStore.updateSettingByPath("fileExplorer.extensions", next);
	};

	// ---------------------------------------------------------------- 列表构建

	const groups = useMemo(() => listGroups(extMap), [extMap]);
	const groupNames = useMemo(() => groups.map((g) => g.name), [groups]);

	/** 排序比较器：文件数降序（同数按名），或纯名称序 */
	const compareExt = useCallback(
		(a: string, b: string) => {
			if (extSort === "count") {
				const diff = (tally.get(b) ?? 0) - (tally.get(a) ?? 0);
				if (diff !== 0) {
					return diff;
				}
			}
			return a.localeCompare(b);
		},
		[extSort, tally],
	);

	const filterQuery = extFilter.trim().toLowerCase();

	/** 筛选命中：扩展名或其组名包含查询串（组名也参与，才能一键筛出整组） */
	const matches = useCallback(
		(ext: string) => {
			if (!filterQuery) {
				return true;
			}
			return (
				ext.toLowerCase().includes(filterQuery) ||
				ruleGroup(extMap[ext]).toLowerCase().includes(filterQuery)
			);
		},
		[filterQuery, extMap],
	);

	/** 分组行 + 其命中的成员；组名自身命中时整组保留 */
	const visibleGroups = useMemo(
		() =>
			groups
				.map((group) => ({
					...group,
					members: groupMembers(extMap, group.name)
						.filter(matches)
						.sort(compareExt),
					files: groupMembers(extMap, group.name).reduce(
						(sum, ext) => sum + (tally.get(ext) ?? 0),
						0,
					),
				}))
				.filter((group) => group.members.length > 0),
		[groups, extMap, matches, compareExt, tally],
	);

	const visibleUngrouped = useMemo(
		() => ungroupedKeys(extMap).filter(matches).sort(compareExt),
		[extMap, matches, compareExt],
	);

	/** 批量动作作用于「当前筛选可见的全部扩展名」，与社区插件页的骰子同一口径 */
	const filteredExts = useMemo(
		() => [
			...visibleGroups.flatMap((group) => group.members),
			...visibleUngrouped,
		],
		[visibleGroups, visibleUngrouped],
	);

	/**
	 * 库里有、但还没配规则的扩展名（按文件数降序取前若干）。
	 *
	 * 这是本页与其余六张同类列表的关键差别：扩展名是唯一没有天然候选源的自由输入，
	 * 用户得先想起来「我库里都有什么类型」。把它列出来，输入框就从「凭记忆默写」
	 * 变成「点一下」。
	 */
	const candidates = useMemo(() => {
		const list: Array<{ ext: string; count: number }> = [];
		for (const [ext, count] of tally) {
			if (!extMap[ext]) {
				list.push({ ext, count });
			}
		}
		return list
			.sort((a, b) => b.count - a.count || a.ext.localeCompare(b.ext))
			.slice(0, CANDIDATE_LIMIT);
	}, [tally, extMap]);

	// ---------------------------------------------------------------- 添加规则

	const addExtension = async () => {
		// 批量：`.` 开头、逗号/空格分隔一次输入多个（如 `.xdb .js`），配同一图标
		const { keys, invalid } = parseExtensionInput(newExt);
		// 无法识别的片段单独说明：过去它们被静默丢掉，用户只看到「少加了一个」
		if (invalid.length > 0) {
			new Notice(extLL.invalidInput({ tokens: invalid.join(" ") }));
		}
		if (keys.length === 0) {
			return;
		}
		const group = normalizeGroupName(newExtGroup);
		// 一次性构造整 map 写入，避免逐条异步写入相互覆盖
		const nextMap: ExtensionMap = { ...extMap };
		const added: string[] = [];
		const skipped: string[] = [];
		for (const ext of keys) {
			// 已配置的扩展名不覆盖（避免二次输入同名把已选图标清空）
			if (nextMap[ext]) {
				skipped.push(ext);
				continue;
			}
			nextMap[ext] = {
				id: ext,
				icon: newExtIcon,
				type: newExtType,
				color: "",
				...(group ? { group } : {}),
			};
			added.push(ext);
		}
		// 全是重复项：以前这里静默什么都不做，用户以为按钮坏了
		if (added.length === 0) {
			new Notice(extLL.allDuplicate());
			return;
		}
		await writeExtensions(nextMap);
		new Notice(
			skipped.length > 0
				? extLL.addedSkipped({
						added: added.length,
						skipped: skipped.length,
					})
				: extLL.added({ count: added.length }),
		);
		setNewExt("");
		setNewExtIcon("");
		setNewExtType("lucide");
		setNewExtGroup("");
	};

	/** 点候选芯片：直接建一条空图标规则，并把输入框预填成它（顺手可以接着配图标） */
	const addCandidate = async (ext: string) => {
		if (extMap[ext]) {
			return;
		}
		const group = normalizeGroupName(newExtGroup);
		await writeExtensions({
			...extMap,
			[ext]: {
				id: ext,
				icon: newExtIcon,
				type: newExtType,
				color: "",
				...(group ? { group } : {}),
			},
		});
		new Notice(extLL.added({ count: 1 }));
	};

	// ---------------------------------------------------------------- 批量动作

	/**
	 * 给筛选出的每一行掷一个图标，**一次落盘**。
	 *
	 * 随机域取自**文件默认图标**（一批同来源）：不按各行自己的来源，否则「尽量互不
	 * 相同」跨池子无意义，各池大小不同、重复策略也难向用户解释。
	 */
	const randomizeFiltered = async () => {
		if (filteredExts.length === 0) {
			return;
		}
		const plugin = settingsStore.plugin;
		const map = extMap;
		// 排除各行当前的图标：尽量不把某行掷回原样（排除后无人可选时 sampleMany
		// 自会退回整池，是尽力而为不是硬约束）
		const exclude = new Set<string>();
		for (const ext of filteredExts) {
			const ref = iconRefOf(map[ext]?.icon ?? "", map[ext]?.type ?? "lucide");
			if (ref) {
				exclude.add(encodeIconRef(ref));
			}
		}
		const anchor = iconRefOf(
			plugin.settings.fileExplorer.fileDefault.icon,
			plugin.settings.fileExplorer.fileDefault.type,
		);
		const picked = randomIconsFor(
			plugin,
			anchor,
			filteredExts.length,
			exclude,
		);
		// 池子空（理论上碰不到，Lucide 恒在）：什么都不写，而不是清空一片图标
		if (picked.length === 0) {
			return;
		}
		const next: ExtensionMap = { ...map };
		filteredExts.forEach((ext, index) => {
			const ref = picked[index];
			// sampleMany 在池子非空时恒返回 count 项，这个兜底只为不依赖那个不变式
			if (!ref || !next[ext]) {
				return;
			}
			next[ext] = { ...next[ext], icon: ref.id, type: ref.type };
		});
		await writeExtensions(next);
	};

	/**
	 * 清空筛选出的这些规则的图标（**保留规则本身**）。
	 *
	 * 要确认：一次动 N 行、没有撤销。与「删除规则」是两件不同的事——清空后这些
	 * 扩展名回落到「文件默认图标」，规则还在，用户随后重配不必重新输入扩展名。
	 */
	const clearFiltered = () => {
		if (filteredExts.length === 0) {
			return;
		}
		const exts = filteredExts;
		const count = exts.length;
		new ConfirmDialog(settingsStore.plugin, {
			title: extLL.clearTitle({ count }),
			confirmLL: extLL.clearConfirm(),
			children: (
				<div className="ci-lib__form">
					<span className="ci-lib__form-warning">
						{extLL.clearBody()}
					</span>
				</div>
			),
			onConfirm: async () => {
				// 重新取当前表：弹窗开着的这段时间里可能已经变了
				const next: ExtensionMap = { ...liveExtMap() };
				for (const ext of exts) {
					if (next[ext]) {
						next[ext] = { ...next[ext], icon: "", color: "" };
					}
				}
				await settingsStore.updateSettingByPath(
					"fileExplorer.extensions",
					next,
				);
				new Notice(extLL.cleared({ count }));
			},
		}).open();
	};

	// ---------------------------------------------------------------- 分组动作

	/**
	 * 分组动作的前置检查：一律重新从 `settings` 取当前表。
	 *
	 * 菜单开着的这段时间里组可能已经没了（另一窗口删空了它、或刚批量移走了最后
	 * 一个成员）。组不在了就说一句退出——静默无事发生是最难排查的那种失败。
	 */
	const takeGroup = useCallback(
		(group: string): string[] | null => {
			const members = groupMembers(liveExtMap(), group);
			if (members.length === 0) {
				new Notice(groupLL.gone({ group }));
				return null;
			}
			return members;
		},
		[liveExtMap, groupLL],
	);

	/** 打开「移到分组」弹窗（`exts` 为空则什么都不做） */
	const openMoveDialog = useCallback(
		(exts: string[], initial: string, sourceEl?: HTMLElement) => {
			if (exts.length === 0) {
				return;
			}
			let submitFn: (() => Promise<boolean>) | null = null;
			new ConfirmDialog(
				settingsStore.plugin,
				{
					title: groupLL.moveTitle(),
					confirmLL: LL.common.save(),
					children: (
						<MoveExtGroup
							groups={groupNames}
							count={exts.length}
							initial={initial}
							onSubmit={async (group) => {
								await settingsStore.updateSettingByPath(
									"fileExplorer.extensions",
									assignGroup(liveExtMap(), exts, group),
								);
								new Notice(
									group
										? groupLL.moved({
												count: exts.length,
												group,
											})
										: groupLL.movedOut({
												count: exts.length,
											}),
								);
							}}
							onReady={(submit) => {
								submitFn = submit;
							}}
						/>
					),
					onConfirm: async () => (submitFn ? await submitFn() : false),
				},
				{ sourceEl },
			).open();
		},
		[settingsStore, liveExtMap, groupNames, groupLL],
	);

	/** 重命名分组：改名到已有组名即合并，由弹窗提前告知 */
	const handleRenameGroup = useCallback(
		(group: string, sourceEl?: HTMLElement) => {
			const members = takeGroup(group);
			if (!members) {
				return;
			}
			let submitFn: (() => Promise<boolean>) | null = null;
			new ConfirmDialog(
				settingsStore.plugin,
				{
					title: groupLL.renameTitle({ group }),
					confirmLL: LL.common.save(),
					children: (
						<RenameExtGroup
							group={group}
							count={members.length}
							groups={groupNames}
							onSubmit={async (next) => {
								await settingsStore.updateSettingByPath(
									"fileExplorer.extensions",
									renameGroup(liveExtMap(), group, next),
								);
								new Notice(
									groupLL.renamed({ from: group, to: next }),
								);
							}}
							onReady={(submit) => {
								submitFn = submit;
							}}
						/>
					),
					onConfirm: async () => (submitFn ? await submitFn() : false),
				},
				{ sourceEl },
			).open();
		},
		[settingsStore, liveExtMap, takeGroup, groupNames, groupLL],
	);

	/**
	 * 解散分组：规则留下、变成未分组。
	 *
	 * 也要确认——它改的是**整组**的归属，撤销只能靠手动重建。但不必危言耸听：
	 * 图标一个没丢，文案就照这么说。
	 */
	const handleDissolveGroup = useCallback(
		(group: string, sourceEl?: HTMLElement) => {
			const members = takeGroup(group);
			if (!members) {
				return;
			}
			const count = members.length;
			new ConfirmDialog(
				settingsStore.plugin,
				{
					title: groupLL.dissolveTitle({ group }),
					confirmLL: groupLL.dissolveConfirm(),
					children: (
						<div className="ci-lib__form">
							<span className="ci-lib__form-hint">
								{groupLL.dissolveBody({ count })}
							</span>
						</div>
					),
					onConfirm: async () => {
						await settingsStore.updateSettingByPath(
							"fileExplorer.extensions",
							dissolveGroup(liveExtMap(), group),
						);
						new Notice(groupLL.dissolved({ group, count }));
					},
				},
				{ sourceEl },
			).open();
		},
		[settingsStore, liveExtMap, takeGroup, groupLL],
	);

	/** 删除分组连同其中的规则：本页破坏性最强的动作，这些扩展名会回落到文件默认图标 */
	const handlePurgeGroup = useCallback(
		(group: string, sourceEl?: HTMLElement) => {
			const members = takeGroup(group);
			if (!members) {
				return;
			}
			const count = members.length;
			new ConfirmDialog(
				settingsStore.plugin,
				{
					title: groupLL.purgeTitle({ group }),
					confirmLL: groupLL.purgeConfirm(),
					children: (
						<div className="ci-lib__form">
							<span className="ci-lib__form-warning">
								{groupLL.purgeBody({ count })}
							</span>
						</div>
					),
					onConfirm: async () => {
						await settingsStore.updateSettingByPath(
							"fileExplorer.extensions",
							deleteGroupWithRules(liveExtMap(), group),
						);
						new Notice(groupLL.purged({ group, count }));
					},
				},
				{ sourceEl },
			).open();
		},
		[settingsStore, liveExtMap, takeGroup, groupLL],
	);

	/**
	 * 分组行的「⋮」菜单：三个动作按破坏性递增排列，删除那一项标红。
	 *
	 * 与 SVG 库的分组菜单同一姿态。另两项都能自己手动恢复（改回名字、把扩展名
	 * 再移回去），只有最后一项会真的丢配置。
	 */
	const handleGroupMenu = useCallback(
		(group: string, event: React.MouseEvent) => {
			event.preventDefault();
			// 现在取住触发它的元素：菜单项的 onClick 稍后才跑，那时 React 合成事件
			// 已被回收，`event.currentTarget` 会是 null。弹窗靠它挂到用户实际操作的
			// 那个窗口（popout 里 activeDocument 不可靠，见 BaseModal）
			const el = event.currentTarget as HTMLElement;
			const menu = new Menu();
			menu.addItem((item) =>
				item
					.setTitle(groupLL.renameAction())
					.setIcon("pencil")
					.onClick(() => handleRenameGroup(group, el)),
			);
			menu.addItem((item) =>
				item
					.setTitle(groupLL.dissolveAction())
					.setIcon("folder-minus")
					.onClick(() => handleDissolveGroup(group, el)),
			);
			menu.addItem((item) => {
				item.setTitle(groupLL.purgeAction())
					.setIcon("trash-2")
					.onClick(() => handlePurgeGroup(group, el));
				item.setWarning(true);
			});
			menu.showAtMouseEvent(event.nativeEvent);
		},
		[
			groupLL,
			handleRenameGroup,
			handleDissolveGroup,
			handlePurgeGroup,
		],
	);

	/**
	 * 从预设创建分组。
	 *
	 * 预设只在这一刻被读一次，之后就是普通用户数据（见 fileExplorerPresets.ts）。
	 * 已属于别的分组的扩展名会被跳过而不是抢过来，且在通知里说明——静默改动用户
	 * 已配好的分组是这里最容易犯、也最难被发现的错。
	 */
	const openPresetDialog = useCallback(
		(sourceEl?: HTMLElement) => {
			let submitFn: (() => Promise<boolean>) | null = null;
			const nameOf = (id: PresetId) =>
				LL.settings.fileExplorer.presets[id]();
			new ConfirmDialog(
				settingsStore.plugin,
				{
					title: groupLL.presetTitle(),
					confirmLL: LL.common.save(),
					children: (
						<PresetPicker
							groups={groupNames}
							nameOf={nameOf}
							countOf={(id) => {
								const preset = findPreset(id);
								if (!preset) {
									return 0;
								}
								return planPreset(
									preset,
									(ext) => Boolean(extMap[ext]),
									(ext) => ruleGroup(extMap[ext]),
									nameOf(id),
								).added.length;
							}}
							onSubmit={async (ids) => {
								const next: ExtensionMap = { ...liveExtMap() };
								const skipped: string[] = [];
								let added = 0;
								let adopted = 0;
								for (const id of ids) {
									const preset = findPreset(id);
									if (!preset) {
										continue;
									}
									const group = nameOf(id);
									const plan = planPreset(
										preset,
										(ext) => Boolean(next[ext]),
										(ext) => ruleGroup(next[ext]),
										group,
									);
									for (const ext of plan.added) {
										next[ext] = {
											id: ext,
											icon: preset.icon,
											type: "lucide",
											color: "",
											group,
										};
									}
									// 已存在但未分组的：并入本组，**保留其现有图标**
									for (const ext of plan.adopted) {
										next[ext] = { ...next[ext], group };
									}
									added += plan.added.length;
									adopted += plan.adopted.length;
									skipped.push(...plan.skipped);
								}
								await settingsStore.updateSettingByPath(
									"fileExplorer.extensions",
									next,
								);
								// 三段分开说：新建了多少、并入了多少、跳过了哪些
								new Notice(
									groupLL.presetCreated({
										groups: ids.length,
										added,
									}),
								);
								if (adopted > 0) {
									new Notice(
										groupLL.presetAdopted({
											count: adopted,
										}),
									);
								}
								if (skipped.length > 0) {
									new Notice(
										groupLL.presetSkipped({
											count: skipped.length,
											exts: skipped.join(" "),
										}),
									);
								}
							}}
							onReady={(submit) => {
								submitFn = submit;
							}}
						/>
					),
					onConfirm: async () => (submitFn ? await submitFn() : false),
				},
				{ sourceEl },
			).open();
		},
		[settingsStore, liveExtMap, groupNames, groupLL, extMap],
	);

	// ---------------------------------------------------------------- 行渲染

	const renderOverrideRow = (
		mapKey: "extensions" | "folders" | "files",
		key: string,
		override: IFileExplorerIconOverride,
		name: string,
		desc?: string,
	) => (
		<SettingItem
			key={`${mapKey}-${key}`}
			name={name}
			desc={desc}
			control={
				<>
					<RandomIconButton
						value={override.icon ?? ""}
						type={override.type ?? "lucide"}
						onPick={async (value, type) => {
							await writeMap(mapKey, key, {
								...override,
								id: key,
								icon: value,
								type,
							});
						}}
					/>
					<ExtraButton
						icon="trash-2"
						tooltip={LL.common.delete()}
						onClick={async () => {
							await writeMap(mapKey, key, undefined);
						}}
					/>
					<IconPicker
						value={override.icon ?? ""}
						type={override.type ?? "lucide"}
						color={override.color}
						onChange={async (value, type) => {
							await writeMap(mapKey, key, {
								...override,
								id: key,
								icon: value,
								type,
							});
						}}
					/>
					<Color
						value={override.color ?? ""}
						onChange={async (rawColor) => {
							// 不再因「还没配图标」early-return：extensions 是唯一
							// 允许留空图标的表，先挑颜色再挑图标是合理顺序，
							// 而原来的守卫让颜色控件在这些行上静默失效
							await writeMap(mapKey, key, {
								...override,
								id: key,
								color: normalizeIconColor(rawColor) ?? "",
							});
						}}
					/>
				</>
			}
		/>
	);

	/** 一条扩展名规则行；`group` 非空时带「从组中移出」按钮 */
	const renderExtRow = (ext: string, group: string) => {
		const override = extMap[ext];
		const count = tally.get(ext) ?? 0;
		// 空图标行是**不生效**的，必须说出来：这是本页唯一允许留空的表，
		// 过去它看起来和配好的行没区别
		const notes = [
			count > 0 ? extLL.fileCount({ count }) : extLL.noFiles(),
			override.icon ? "" : extLL.needIcon(),
		].filter(Boolean);
		return (
			<SettingItem
				key={`extensions-${ext}`}
				name={`.${ext}`}
				desc={notes.join(" · ")}
				className={group ? "ci-fe__ext-row--grouped" : undefined}
				control={
					<>
						<ExtraButton
							icon={group ? "folder-minus" : "folder-input"}
							tooltip={
								group
									? groupLL.removeTooltip({ group, ext })
									: groupLL.groupTooltip()
							}
							onClick={async () => {
								if (group) {
									// 组内行上这个按钮就是「移出本组」，不再多开一个弹窗
									await writeExtensions(
										assignGroup(extMap, [ext], ""),
									);
									new Notice(groupLL.movedOut({ count: 1 }));
									return;
								}
								openMoveDialog([ext], "");
							}}
						/>
						<RandomIconButton
							value={override.icon ?? ""}
							type={override.type ?? "lucide"}
							onPick={async (value, type) => {
								await writeMap("extensions", ext, {
									...override,
									id: ext,
									icon: value,
									type,
								});
							}}
						/>
						<ExtraButton
							icon="trash-2"
							tooltip={LL.common.delete()}
							onClick={async () => {
								await writeMap("extensions", ext, undefined);
							}}
						/>
						<IconPicker
							value={override.icon ?? ""}
							type={override.type ?? "lucide"}
							color={override.color}
							onChange={async (value, type) => {
								await writeMap("extensions", ext, {
									...override,
									id: ext,
									icon: value,
									type,
								});
							}}
						/>
						<Color
							value={override.color ?? ""}
							onChange={async (rawColor) => {
								await writeMap("extensions", ext, {
									...override,
									id: ext,
									color: normalizeIconColor(rawColor) ?? "",
								});
							}}
						/>
					</>
				}
			/>
		);
	};

	/**
	 * 分组行：这里的图标选择器一次改**整组**（`setGroupIcon` 扇出 + 一次落盘）。
	 *
	 * 组内图标不一致时如实显示「混合」而不是假装一致——组的图标不是单一真相
	 * （每个成员各存一份），藏起来会让「我明明单独改过 .svg」凭空消失。
	 */
	const renderGroupRow = (
		group: string,
		memberCount: number,
		fileCount: number,
	) => {
		const uniform = uniformIcon(extMap, group);
		if (!uniform) {
			return null;
		}
		const notes = [
			groupLL.summary({ exts: memberCount, files: fileCount }),
			uniform.mixed ? groupLL.mixed() : "",
		].filter(Boolean);
		return (
			<SettingItem
				key={`group-${group}`}
				name={group}
				desc={notes.join(" · ")}
				className="ci-fe__group-row"
				control={
					<>
						{/*
						 * 用原生 button 而不是 ExtraButton：Obsidian 的
						 * ExtraButtonComponent 只给 `() => void`，拿不到事件，
						 * 而这里两样都要——`showAtMouseEvent` 定位菜单，
						 * `currentTarget` 决定弹窗挂到哪个窗口（popout 里
						 * activeDocument 不可靠，见 BaseModal）。
						 */}
						<button
							className="clickable-icon ci-fe__group-menu"
							aria-label={groupLL.manageTooltip()}
							onClick={(event) => handleGroupMenu(group, event)}
						>
							<MoreVertical size={16} />
						</button>
						<RandomIconButton
							value={uniform.icon}
							type={uniform.type}
							onPick={async (value, type) => {
								await writeExtensions(
									setGroupIcon(extMap, group, value, type),
								);
							}}
						/>
						<IconPicker
							value={uniform.mixed ? "" : uniform.icon}
							type={uniform.type}
							color={uniform.mixed ? undefined : uniform.color}
							onChange={async (value, type) => {
								await writeExtensions(
									setGroupIcon(extMap, group, value, type),
								);
							}}
						/>
						<Color
							value={uniform.mixed ? "" : uniform.color}
							onChange={async (rawColor) => {
								// 只改颜色，不顺手把混合的图标统一掉
								await writeExtensions(
									setGroupColor(
										extMap,
										group,
										normalizeIconColor(rawColor) ?? "",
									),
								);
							}}
						/>
					</>
				}
			/>
		);
	};

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
						<RandomIconButton
							value={icon.icon}
							type={icon.type}
							onPick={async (value, type) => {
								// 一次写整个默认项而不是 icon / type 各写一次：每次写入
								// 都是一遍 saveSettings + applyAll，而中间那一拍还是
								// 「新 icon 配旧 type」的错配状态（会渲染出不存在的图标）
								await settingsStore.updateSettingByPath(
									`fileExplorer.${field}`,
									{ ...icon, icon: value, type },
								);
							}}
						/>
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
							value={icon.icon}
							type={icon.type}
							color={icon.color}
							onChange={async (value, type) => {
								await settingsStore.updateSettingByPath(
									`fileExplorer.${field}`,
									{ ...icon, icon: value, type },
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

	// ---------------------------------------------------------------- 单项覆盖

	const overrideQuery = overrideFilter.trim().toLowerCase();
	const matchPath = (path: string) =>
		!overrideQuery || path.toLowerCase().includes(overrideQuery);

	const folderEntries = Object.entries(fe.folders).filter(([path]) =>
		matchPath(path),
	);
	const fileEntries = Object.entries(fe.files).filter(([path]) =>
		matchPath(path),
	);
	const hasAnyOverride =
		Object.keys(fe.folders).length > 0 || Object.keys(fe.files).length > 0;

	const extCount = Object.keys(extMap).length;

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
				<FeatureOffNotice enabled={fe.enable} />
			</SettingGroup>

			{/* 总开关以下全部随它禁用：关着的时候这些配置一条都不生效 */}
			<SettingGroup disabled={!fe.enable}>
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

			<SettingGroup title={extLL.name()} disabled={!fe.enable}>
				<SettingItem desc={extLL.desc()} />

				{/* 添加行：扩展名 + 图标 + 可选分组 */}
				<SettingItem
					control={
						<>
							<Text
								value={newExt}
								placeholder={extLL.placeholder()}
								onChange={(value) => setNewExt(value)}
							/>
							<Text
								value={newExtGroup}
								placeholder={groupLL.placeholder()}
								onChange={(value) => setNewExtGroup(value)}
							/>
							<IconPicker
								value={newExtIcon}
								type={newExtType}
								onChange={(value, type) => {
									setNewExtIcon(value);
									setNewExtType(type);
								}}
							/>
							<ExtraButton
								icon="plus"
								tooltip={extLL.addTooltip()}
								onClick={addExtension}
							/>
							<ExtraButton
								icon="folder-plus"
								tooltip={groupLL.presetTooltip()}
								onClick={() => openPresetDialog()}
							/>
						</>
					}
				/>

				{/* 库里有、还没配规则的扩展名：点一下即添加 */}
				{candidates.length > 0 && (
					<SettingItem
						name={extLL.candidates()}
						className="ci-fe__candidates"
						control={
							<div className="ci-fe__chips">
								{candidates.map(({ ext, count }) => (
									<button
										key={ext}
										className="ci-fe__chip"
										aria-label={extLL.candidateTooltip({
											ext,
											count,
										})}
										onClick={() => {
											void addCandidate(ext);
										}}
									>
										.{ext}
										<span className="ci-fe__chip-count">
											{count}
										</span>
									</button>
								))}
							</div>
						}
					/>
				)}

				{extCount === 0 && <SettingItem name={extLL.noneFound()} />}

				{/* 筛选 + 排序 + 批量：批量动作作用于当前筛选出的全部规则 */}
				{extCount > 0 && (
					<SettingItem
						name={
							<Search
								value={extFilter}
								onChange={(value) => setExtFilter(value)}
								placeholder={extLL.filterPlaceholder()}
							/>
						}
						control={
							<>
								<ExtraButton
									icon={
										extSort === "count"
											? "arrow-down-0-1"
											: "arrow-down-a-z"
									}
									tooltip={extLL.sortTooltip({
										mode:
											extSort === "count"
												? extLL.sortByCount()
												: extLL.sortByName(),
									})}
									onClick={() => {
										setExtSort((prev) =>
											prev === "count" ? "name" : "count",
										);
									}}
								/>
								<ExtraButton
									icon="dices"
									tooltip={extLL.dicesTooltip()}
									onClick={randomizeFiltered}
								/>
								<ExtraButton
									icon="eraser"
									tooltip={extLL.clearTooltip()}
									onClick={clearFiltered}
								/>
							</>
						}
					/>
				)}

				{extCount > 0 && filteredExts.length === 0 && (
					<SettingItem name={extLL.noneMatched()} />
				)}

				{/* 分组行 + 组内成员 */}
				{visibleGroups.map((group) => (
					<Fragment key={`group-block-${group.name}`}>
						{renderGroupRow(group.name, group.count, group.files)}
						{group.members.map((ext) =>
							renderExtRow(ext, group.name),
						)}
					</Fragment>
				))}

				{/* 未分组：只有在同时存在分组时才需要这条分隔标题 */}
				{visibleGroups.length > 0 && visibleUngrouped.length > 0 && (
					<SettingItem name={groupLL.ungrouped()} heading />
				)}
				{visibleUngrouped.map((ext) => renderExtRow(ext, ""))}
			</SettingGroup>

			<SettingGroup
				title={LL.settings.fileExplorer.overrides.name()}
				disabled={!fe.enable}
			>
				<SettingItem desc={LL.settings.fileExplorer.overrides.desc()} />
				{!hasAnyOverride && (
					<SettingItem
						name={LL.settings.fileExplorer.overrides.noneFound()}
					/>
				)}
				{hasAnyOverride && (
					<SettingItem
						name={
							<Search
								value={overrideFilter}
								onChange={(value) => setOverrideFilter(value)}
								placeholder={LL.settings.fileExplorer.overrides.filterPlaceholder()}
							/>
						}
					/>
				)}
				{hasAnyOverride &&
					folderEntries.length === 0 &&
					fileEntries.length === 0 && (
						<SettingItem
							name={LL.settings.fileExplorer.overrides.noneMatched()}
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
