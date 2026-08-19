import usePluginSettings from "@src/hooks/usePluginSettings";
import useSettingsStore from "@src/hooks/useSettingsStore";
import { LL } from "@src/i18n/i18n";
import { CirclePlus, Code } from "lucide-react";
import { Notice, setIcon } from "obsidian";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconCard } from "../icon-card/IconCard";
import { ConfirmDialog } from "../modal/ConfirmDialog";
import { AddSvg } from "./AddSvg";
import { EditSvg } from "./EditSvg";
import { VirtualIconGrid } from "./VirtualIconGrid";

export const SvgLib: React.FC = () => {
	const store = useSettingsStore();
	const settings = usePluginSettings(store);

	// Local State
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	const sortButtonRef = useRef<HTMLButtonElement>(null);

	// Filter and Sort Icons
	const filteredIcons = useMemo(() => {
		const icons = [...settings.customIconLib.svg]; // Shallow copy

		const result = icons.filter(
			(icon) =>
				!searchQuery ||
				icon.id.toLowerCase().includes(searchQuery.toLowerCase()),
		);

		result.sort((a, b) => {
			return sortOrder === "asc"
				? a.id.localeCompare(b.id)
				: b.id.localeCompare(a.id);
		});

		return result;
	}, [settings.customIconLib.svg, searchQuery, sortOrder]);

	// Update sort button icon when sortOrder changes
	useEffect(() => {
		if (sortButtonRef.current) {
			sortButtonRef.current.empty();
			const iconName =
				sortOrder === "asc" ? "arrow-up-az" : "arrow-up-za";
			setIcon(sortButtonRef.current, iconName);
		}
	}, [sortOrder]);

	// Handlers
	const handleToggleSort = () => {
		setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
	};

	const handleSubmit = async (
		icons: Array<{ id: string; content: string }>,
	) => {
		const currentSvgIcons = settings.customIconLib.svg;
		const newIcons = icons.filter(
			(icon) =>
				!currentSvgIcons.some((existing) => existing.id === icon.id),
		);

		if (newIcons.length === 0) {
			return;
		}

		const newSvgIcons = [...currentSvgIcons, ...newIcons];
		await store.updateSettingByPath("customIconLib.svg", newSvgIcons);
	};

	const handleOpenAddModal = () => {
		let submitFn: (() => Promise<void>) | null = null;

		new ConfirmDialog(store.plugin, {
			title: LL.common.add() + " " + LL.view.CustomIconLib.svg.tabName(),
			confirmLL: LL.common.add(),
			children: (
				<AddSvg
					onSubmit={handleSubmit}
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

	const handleDeleteIcon = (iconId: string) => {
		new ConfirmDialog(store.plugin, {
			title: `${LL.common.delete()} "${iconId}"?`,
			confirmLL: LL.common.delete(),
			onConfirm: async () => {
				const currentSvgIcons = settings.customIconLib.svg;
				const newSvgIcons = currentSvgIcons.filter(
					(icon) => icon.id !== iconId,
				);
				await store.updateSettingByPath(
					"customIconLib.svg",
					newSvgIcons,
				);
			},
		}).open();
	};

	const handleEditIcon = async (
		iconId: string,
		newIconId: string,
		newIconContent: string,
	) => {
		const currentSvgIcons = settings.customIconLib.svg;
		const iconIndex = currentSvgIcons.findIndex(
			(icon) => icon.id === iconId,
		);

		if (iconIndex === -1) {
			return;
		}

		const newSvgIcons = [...currentSvgIcons];
		newSvgIcons[iconIndex] = {
			id: newIconId,
			content: newIconContent,
		};

		await store.updateSettingByPath("customIconLib.svg", newSvgIcons);
	};

	const handleOpenEditModal = async (iconId: string) => {
		const icon = settings.customIconLib.svg.find(
			(icon) => icon.id === iconId,
		);
		if (!icon) {
			return;
		}

		let submitFn: (() => Promise<void>) | null = null;

		new ConfirmDialog(store.plugin, {
			title: LL.common.edit() + " " + LL.view.CustomIconLib.svg.tabName(),
			confirmLL: LL.common.save(),
			children: (
				<EditSvg
					iconId={icon.id}
					iconContent={icon.content}
					onSubmit={(newIconId, newIconContent) =>
						handleEditIcon(iconId, newIconId, newIconContent)
					}
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

	const handleCopySvgCode = async (iconId: string) => {
		const icon = settings.customIconLib.svg.find(
			(icon) => icon.id === iconId,
		);
		if (!icon) {
			return;
		}

		try {
			await navigator.clipboard.writeText(icon.content);
			new Notice(`Copied SVG code: ${iconId}`);
		} catch (err) {
			console.error("Failed to copy SVG code:", err);
			new Notice("Failed to copy SVG code");
		}
	};

	return (
		<div className="ci-lib-container">
			{/* Navigation Bar */}
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
					ref={sortButtonRef}
					onClick={handleToggleSort}
					aria-label={sortOrder === "asc" ? "A-Z" : "Z-A"}
				/>

				<button onClick={handleOpenAddModal}>
					<CirclePlus className="svg-icon" />
				</button>
			</div>

			{/* Icon Grid */}
			<VirtualIconGrid
				items={filteredIcons}
				getKey={(icon) => icon.id}
				renderItem={(icon) => (
					<IconCard
						id={icon.id}
						onDelete={handleDeleteIcon}
						onEdit={handleOpenEditModal}
						customActions={[
							{
								icon: <Code className="svg-icon" />,
								title: LL.view.CustomIconLib.svg.copyAction(),
								onClick: handleCopySvgCode,
							},
						]}
					/>
				)}
			/>
		</div>
	);
};
