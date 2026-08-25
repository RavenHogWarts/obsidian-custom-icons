import { LL } from "@src/i18n/i18n";
import { validateSvgContent } from "@src/service/icon-packs/sanitize";
import { Notice } from "obsidian";
import { useEffect, useMemo, useState } from "react";
import { Tab, TabItem } from "../tab/Tab";
import { SvgGlyph } from "./SvgGlyph";

/** 重名处理策略（仅在检测到重名时才呈现给用户） */
export type DuplicateStrategy = "skip" | "rename" | "overwrite";

const STRATEGIES: DuplicateStrategy[] = ["skip", "rename", "overwrite"];

/** 待写入的图标：content 为**用户原文**，不做改写（注册时另有 sanitize） */
export interface PendingIcon {
	id: string;
	content: string;
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
	onSubmit: (
		icons: PendingIcon[],
		strategy: DuplicateStrategy,
	) => Promise<AddSvgResult>;
	/** submit 返回 false = 校验未通过，ConfirmDialog 应保持弹窗打开 */
	onReady?: (submit: () => Promise<boolean>) => void;
}

/** 单个待上传文件的校验结果 */
interface FileEntry {
	name: string;
	id: string;
	/** 用户原文；null = 无法解析为合法 SVG */
	content: string | null;
	duplicate: boolean;
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
	onSubmit,
	onReady,
}) => {
	const [activeTab, setActiveTab] = useState<"paste" | "upload">("paste");
	const [iconId, setIconId] = useState("");
	const [iconContent, setIconContent] = useState("");
	const [files, setFiles] = useState<FileEntry[] | null>(null);
	const [reading, setReading] = useState(false);
	const [strategy, setStrategy] = useState<DuplicateStrategy>("skip");
	const [error, setError] = useState<string | null>(null);

	const modal = LL.view.CustomIconLib.svg.modal;
	const existing = useMemo(() => new Set(existingIds), [existingIds]);

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

	// ---------- 上传模式 ----------
	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		setError(null);
		const picked = Array.from(e.target.files ?? []);
		if (picked.length === 0) {
			setFiles(null);
			return;
		}
		setReading(true);
		try {
			const entries: FileEntry[] = [];
			for (const file of picked) {
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
					[{ id: trimmedId, content: trimmedContent }],
					strategy,
				),
			);
		}

		if (!files || files.length === 0) {
			setError(modal.filesRequired());
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
			{conflictPicker}
		</div>
	);

	const uploadTab = (
		<div className="ci-lib__form">
			<span className="ci-lib__form-label">{modal.selectFiles()}</span>
			<input
				className="ci-lib__form__input"
				type="file"
				accept=".svg"
				multiple
				onChange={(e) => void handleFileChange(e)}
			/>
			<span className="ci-lib__form-hint">{modal.selectFilesDesc()}</span>
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
			{conflictPicker}
		</div>
	);

	const tabItems: TabItem[] = [
		{ id: "paste", title: modal.pasteMode(), content: pasteTab },
		{ id: "upload", title: modal.uploadMode(), content: uploadTab },
	];

	return (
		<>
			<Tab
				items={tabItems}
				defaultValue="paste"
				onChange={(value) => {
					setActiveTab(value as "paste" | "upload");
					setError(null);
				}}
			/>
			{error && <div className="ci-lib__form-error">{error}</div>}
		</>
	);
};
