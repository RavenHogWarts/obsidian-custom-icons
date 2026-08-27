import { ICommunityPluginIcon } from "@src/types/types";
import { resolveCommunityPluginIcon } from "./communityPluginIcon";

const defaultIcon: ICommunityPluginIcon = {
	id: "",
	icon: "puzzle",
	type: "lucide",
	color: "",
};

describe("resolveCommunityPluginIcon", () => {
	it("无覆盖时用默认图标", () => {
		expect(resolveCommunityPluginIcon("dataview", defaultIcon)).toMatchObject(
			{ id: "dataview", icon: "puzzle", type: "lucide" },
		);
	});

	it("单插件覆盖优先于默认", () => {
		expect(
			resolveCommunityPluginIcon("dataview", defaultIcon, {
				id: "dataview",
				icon: "database",
				type: "lucide",
			}),
		).toMatchObject({ icon: "database" });
	});

	describe("图标画不出来时回落到默认（图标包被停用 / 图标被删）", () => {
		/** 假装 mdi 包被停用 */
		const canRender = (icon?: string, type?: string) =>
			Boolean(icon) && (type === "lucide" || !icon!.startsWith("CI-mdi-"));

		const dead = { id: "dataview", icon: "CI-mdi-db", type: "svg" as const };

		it("失效的覆盖回落到默认图标", () => {
			// 不传判定时保持旧行为
			expect(
				resolveCommunityPluginIcon("dataview", defaultIcon, dead),
			).toMatchObject({ icon: "CI-mdi-db" });
			expect(
				resolveCommunityPluginIcon(
					"dataview",
					defaultIcon,
					dead,
					canRender,
				),
			).toMatchObject({ icon: "puzzle", type: "lucide" });
		});

		it("回落时 type 一并跟着默认走，不留 svg + lucide 名的错配", () => {
			const resolved = resolveCommunityPluginIcon(
				"dataview",
				defaultIcon,
				dead,
				canRender,
			);
			expect(resolved.type).toBe("lucide");
		});

		it("空串是「显式不显示图标」，不算失效，不回落", () => {
			// normalizeCommunityPluginOverride 会把空串存下来，语义是用户主动清空；
			// 若把它当失效回落到默认，用户就永远关不掉这一行的图标了
			expect(
				resolveCommunityPluginIcon(
					"dataview",
					defaultIcon,
					{ id: "dataview", icon: "", type: "lucide" },
					canRender,
				),
			).toMatchObject({ icon: "" });
		});

		it("重新启用图标包后立刻恢复——设置从未被改写", () => {
			expect(
				resolveCommunityPluginIcon(
					"dataview",
					defaultIcon,
					dead,
					() => true,
				),
			).toMatchObject({ icon: "CI-mdi-db" });
		});
	});
});
