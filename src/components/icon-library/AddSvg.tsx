import { LL } from "@src/i18n/i18n";
import { validateSvgContent } from "@src/service/icon-packs/sanitize";
import { normalizeGroupName } from "@src/util/svgGroups";
import { parseSvgLibrary } from "@src/util/svgLibrary";
import { Upload } from "lucide-react";
import { Notice } from "obsidian";
import { useEffect, useMemo, useState } from "react";
import { Tab, TabItem } from "../tab/Tab";
import { GroupInput } from "./GroupInput";
import { SvgGlyph } from "./SvgGlyph";

/** 添加方式：粘贴源码 / 上传 .svg 文件 / 导入导出的 JSON */
type AddMode = "paste" | "upload" | "import";

/** 重名处理策略（仅在检测到重名时才呈现给用户） */
export type DuplicateStrategy = "skip" | "rename" | "overwrite";

const STRATEGIES: DuplicateStrategy[] = ["skip", "rename", "overwrite"];

/** 待写入的图标：content 为**用户原文**，不做改写（注册时另有 sanitize） */
export interface PendingIcon {
	id: string;
	content: string;
	/** 导入时可能自带（保留原始添加时间）；否则由写入方补当前时间 */
	addedAt?: number;
	/** 所属分组；空串 / 缺失 = 不分组 */
	group?: string;
}

/** 写入结果，用于如实告知用户实际发生了什么 */
export interface AddSvgResult {
	added: number;
	overwritten: number;
	/** 被跳过的重名 id */
	skipped: string[];
}

interface AddSvgProps {
	/** 已存在的图标 ID，用于实时重名检测 */
	existingIds: string[];
	/** 已存在的分组名，作为组名输入的候选 */
	existingGroups: string[];
	onSubmit: (
		icons: PendingIcon[],
		strategy: DuplicateStrategy,
	) => Promise<AddSvgResult>;
	/** submit 返回 false = 校验未通过，ConfirmDialog 应保持弹窗打开 */
	onReady?: (submit: () => Promise<boolean>) => void;
}

/** 单个待写入条目的校验结果（上传文件与导入 JSON 共用） */
interface FileEntry {
	name: string;
	id: string;
	/** 用户原文；null = 无法解析为合法 SVG */
	content: string | null;
	duplicate: boolean;
	/** 导入时自带的原始添加时间 */
	addedAt?: number;
	/** 导入时自带的分组（组名框留空则沿用它） */
	group?: string;
}

/** 把结果拼成一条人话 Notice：只列出发生了的部分 */
const describeResult = (result: AddSvgResult): string => {
	const modal = LL.view.CustomIconLib.svg.modal;
	const parts: string[] = [];
	if (result.added > 0) {
		parts.push(modal.resultAdded({ count: result.added }));
	}
	if (result.overwritten > 0) {
		parts.push(modal.resultOverwritten({ count: result.overwritten }));
	}
	if (result.skipped.length > 0) {
		parts.push(modal.resultSkipped({ count: result.skipped.length }));
	}
	return parts.join(" · ");
};

export const AddSvg: React.FC<AddSvgProps> = ({
	existingIds,
	existingGroups,
	onSubmit,
	onReady,
}) => {
	const [activeTab, setActiveTab] = useState<AddMode>("paste");
	const [iconId, setIconId] = useState("");
	const [iconContent, setIconContent] = useState("");
	const [files, setFiles] = useState<FileEntry[] | null>(null);
	const [reading, setReading] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [strategy, setStrategy] = useState<DuplicateStrategy>("skip");
	const [error, setError] = useState<string | null>(null);
	/** 组名：三个模式共用一份（换页签不清空——用户填了组名再换模式不该白填） */
	const [group, setGroup] = useState("");

	const modal = LL.view.CustomIconLib.svg.modal;
	const groupLL = LL.view.CustomIconLib.svg.group;
	const existing = useMemo(() => new Set(existingIds), [existingIds]);

	// 组名走同一套收敛（trim + 长度上限），与「移到分组」写入的值形态一致，
	// 否则同一个组会因为一处 trim 一处没 trim 而裂成两个
	const trimmedGroup = normalizeGroupName(group);

	// ---------- 粘贴模式的实时校验 ----------
	const trimmedId = iconId.trim();
	const trimmedContent = iconContent.trim();
	const pasteDuplicate = trimmedId !== "" && existing.has(trimmedId);
	/** 规范化结果：非 null 即为合法，同时作为预览来源 */
	const pastePreview = useMemo(
		() => (trimmedContent ? validateSvgContent(trimmedContent) : null),
		[trimmedContent],
	);
	const pasteInvalid = trimmedContent !== "" && pastePreview === null;

	// ---------- 上传 / 导入模式（共用同一份条目列表与重名策略）----------
	/** 读 .svg 文件：文件名去扩展名即图标 id */
	const readSvgFiles = async (picked: File[]) => {
		setError(null);
		const svgs = picked.filter((file) => /\.svg$/i.test(file.name));
		if (svgs.length === 0) {
			setFiles(null);
			// 拖进来的全是非 .svg：明确说一声，而不是静默什么都不发生
			if (picked.length > 0) {
				setError(modal.allInvalid());
			}
			return;
		}
		setReading(true);
		try {
			const entries: FileEntry[] = [];
			for (const file of svgs) {
				const raw = await file.text();
				const id = file.name.replace(/\.svg$/i, "");
				entries.push({
					name: file.name,
					id,
					content: validateSvgContent(raw) ? raw : null,
					duplicate: existing.has(id),
				});
			}
			setFiles(entries);
		} catch (e) {
			console.error("Failed to read svg files:", e);
			setFiles(null);
			setError(modal.allInvalid());
		} finally {
			setReading(false);
		}
	};

	/** 读导出的 JSON：一个文件里带出多个图标 */
	const readLibraryFile = async (file: File) => {
		setError(null);
		setReading(true);
		try {
			const parsed = parseSvgLibrary(await file.text());
			if (!parsed) {
				setFiles(null);
				setError(modal.importInvalid());
				return;
			}
			if (parsed.length === 0) {
				setFiles(null);
				setError(modal.importEmpty());
				return;
			}
			setFiles(
				parsed.map((icon) => ({
					name: icon.id,
					id: icon.id,
					content: validateSvgContent(icon.content)
						? icon.content
						: null,
					duplicate: existing.has(icon.id),
					addedAt: icon.addedAt,
					group: icon.group,
				})),
			);
		} catch (e) {
			console.error("Failed to read icon library file:", e);
			setFiles(null);
			setError(modal.importInvalid());
		} finally {
			setReading(false);
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const picked = Array.from(e.target.files ?? []);
		if (activeTab === "import") {
			if (picked[0]) {
				await readLibraryFile(picked[0]);
			}
			return;
		}
		await readSvgFiles(picked);
	};

	const usableFiles = (files ?? []).filter((f) => f.content !== null);
	const hasConflict =
		activeTab === "paste"
			? pasteDuplicate
			: usableFiles.some((f) => f.duplicate);

	// ---------- 提交 ----------
	const report = (result: AddSvgResult): boolean => {
		if (result.added === 0 && result.overwritten === 0) {
			setError(modal.allDuplicate());
			return false;
		}
		new Notice(describeResult(result));
		return true;
	};

	const handleSubmit = async (): Promise<boolean> => {
		setError(null);

		if (activeTab === "paste") {
			if (!trimmedId) {
				setError(modal.idRequired());
				return false;
			}
			if (!trimmedContent) {
				setError(modal.contentRequired());
				return false;
			}
			if (pastePreview === null) {
				setError(modal.invalidSvg());
				return false;
			}
			if (pasteDuplicate && strategy === "skip") {
				setError(modal.duplicateId({ id: trimmedId }));
				return false;
			}
			return report(
				await onSubmit(
					[
						{
							id: trimmedId,
							content: trimmedContent,
							group: trimmedGroup,
						},
					],
					strategy,
				),
			);
		}

		if (!files || files.length === 0) {
			setError(
				activeTab === "import"
					? modal.importEmpty()
					: modal.filesRequired(),
			);
			return false;
		}
		if (usableFiles.length === 0) {
			setError(modal.allInvalid());
			return false;
		}
		if (strategy === "skip" && usableFiles.every((f) => f.duplicate)) {
			setError(modal.allDuplicate());
			return false;
		}
		return report(
			await onSubmit(
				usableFiles.map((f) => ({
					id: f.id,
					content: f.content as string,
					// 导入时保留原始添加时间，让「最近添加」排序仍然可信
					...(f.addedAt !== undefined ? { addedAt: f.addedAt } : {}),
					// 组名框留空时沿用文件自带的组（导入 JSON 才可能有），
					// 填了则整批统一覆盖——importHint 就是在说这条规则
					group: trimmedGroup || f.group || "",
				})),
				strategy,
			),
		);
	};

	// 每次渲染都重新登记，保证 ConfirmDialog 拿到的是最新闭包
	useEffect(() => {
		onReady?.(handleSubmit);
	});

	const conflictPicker = hasConflict && (
		<div className="ci-lib__form-row">
			<span className="ci-lib__form-label">
				{modal.conflictLabel()}
			</span>
			<div className="ci-lib__form-choices" role="group">
				{STRATEGIES.map((key) => (
					<button
						key={key}
						className={`ci-lib__form-choice${strategy === key ? " is-active" : ""}`}
						aria-pressed={strategy === key}
						onClick={() => setStrategy(key)}
					>
						{key === "skip"
							? modal.conflictSkip()
							: key === "rename"
								? modal.conflictRename()
								: modal.conflictOverwrite()}
					</button>
				))}
			</div>
		</div>
	);

	/**
	 * 组名输入：三个模式共用同一份 state，但说明文案不同——
	 * 导入模式下「留空」有特殊语义（沿用文件里各自的组），必须写出来。
	 */
	const groupField = (
		<GroupInput
			groups={existingGroups}
			value={group}
			onChange={setGroup}
			hint={
				activeTab === "import"
					? groupLL.importHint()
					: groupLL.addHint()
			}
		/>
	);

	const pasteTab = (
		<div className="ci-lib__form">
			<input
				className={`ci-lib__form__input${pasteDuplicate && strategy === "skip" ? " is-invalid" : ""}`}
				type="text"
				placeholder={modal.idPlaceholder()}
				value={iconId}
				onChange={(e) => setIconId(e.target.value)}
			/>
			{pasteDuplicate && (
				<div className="ci-lib__form-warning">
					{modal.duplicateId({ id: trimmedId })}
				</div>
			)}
			<textarea
				className={`ci-lib__form__textarea${pasteInvalid ? " is-invalid" : ""}`}
				placeholder={modal.contentPlaceholder()}
				rows={10}
				value={iconContent}
				onChange={(e) => setIconContent(e.target.value)}
			/>
			{pasteInvalid && (
				<div className="ci-lib__form-error">{modal.invalidSvg()}</div>
			)}
			{pastePreview && (
				<div className="ci-lib__form-preview">
					<span className="ci-lib__form-label">
						{modal.previewTitle()}
					</span>
					<SvgGlyph
						svg={pastePreview}
						className="ci-lib__form-preview-glyph"
						label={trimmedId || modal.previewTitle()}
					/>
				</div>
			)}
			{groupField}
			{conflictPicker}
		</div>
	);

	/** 上传 / 导入共用的条目清单（逐条 ✓ / 重名 / 无法解析） */
	const fileList = (
		<>
			{reading && (
				<div className="ci-lib__form-hint">{modal.reading()}</div>
			)}
			{files && files.length > 0 && (
				<>
					<span className="ci-lib__form-label">
						{modal.selectedFiles({ count: files.length })}
					</span>
					<ul className="ci-lib__file-list">
						{files.map((file, index) => (
							<li
								key={`${file.name}-${index}`}
								className="ci-lib__file-item"
							>
								<span className="ci-lib__file-name">
									{file.name}
								</span>
								<span
									className={`ci-lib__file-status ci-lib__file-status--${
										file.content === null
											? "invalid"
											: file.duplicate
												? "duplicate"
												: "ok"
									}`}
								>
									{file.content === null
										? modal.fileInvalid()
										: file.duplicate
											? modal.fileDuplicate()
											: modal.fileOk()}
								</span>
							</li>
						))}
					</ul>
				</>
			)}
		</>
	);

	const uploadTab = (
		<div className="ci-lib__form">
			{/* 拖放区：把 .svg 直接拖进来，比先点开文件选择器少一步 */}
			<div
				className={`ci-lib__dropzone${dragging ? " is-active" : ""}`}
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={(e) => {
					e.preventDefault();
					setDragging(false);
					void readSvgFiles(Array.from(e.dataTransfer.files));
				}}
			>
				<Upload className="svg-icon" />
				<span>{dragging ? modal.dropActive() : modal.dropHint()}</span>
			</div>
			<input
				className="ci-lib__form__input"
				type="file"
				accept=".svg"
				multiple
				aria-label={modal.selectFiles()}
				onChange={(e) => void handleFileChange(e)}
			/>
			<span className="ci-lib__form-hint">{modal.selectFilesDesc()}</span>
			{fileList}
			{groupField}
			{conflictPicker}
		</div>
	);

	const importTab = (
		<div className="ci-lib__form">
			<span className="ci-lib__form-label">{modal.importPick()}</span>
			<input
				className="ci-lib__form__input"
				type="file"
				accept=".json,application/json"
				aria-label={modal.importPick()}
				onChange={(e) => void handleFileChange(e)}
			/>
			<span className="ci-lib__form-hint">{modal.importDesc()}</span>
			{fileList}
			{groupField}
			{conflictPicker}
		</div>
	);

	const tabItems: TabItem[] = [
		{ id: "paste", title: modal.pasteMode(), content: pasteTab },
		{ id: "upload", title: modal.uploadMode(), content: uploadTab },
		{ id: "import", title: modal.importMode(), content: importTab },
	];

	return (
		<>
			<Tab
				items={tabItems}
				defaultValue="paste"
				onChange={(value) => {
					setActiveTab(value as AddMode);
					// 换模式清空上一模式读进来的条目，避免"看着是 JSON 却提交了 svg 文件"
					setFiles(null);
					setError(null);
				}}
			/>
			{error && <div className="ci-lib__form-error">{error}</div>}
		</>
	);
};
