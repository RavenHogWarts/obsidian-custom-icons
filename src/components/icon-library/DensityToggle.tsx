import { LL } from "@src/i18n/i18n";
import {
	ICON_GRID_DENSITIES,
	IconGridDensity,
} from "@src/util/iconGridDensity";
import { Grid2x2, Grid3x3, LayoutGrid } from "lucide-react";

const DENSITY_ICON: Record<IconGridDensity, React.ReactNode> = {
	compact: <Grid3x3 className="svg-icon" />,
	normal: <Grid2x2 className="svg-icon" />,
	large: <LayoutGrid className="svg-icon" />,
};

interface DensityToggleProps {
	value: IconGridDensity;
	onChange: (density: IconGridDensity) => void;
}

/**
 * 网格密度三档切换（紧凑 / 标准 / 大）。
 * 图标按钮而非文字：工具栏还要放搜索、筛选、排序，横向空间紧张。
 */
export const DensityToggle: React.FC<DensityToggleProps> = ({
	value,
	onChange,
}) => {
	const density = LL.view.CustomIconLib.density;
	return (
		<div
			className="ci-lib__filter"
			role="group"
			aria-label={density.label()}
		>
			{ICON_GRID_DENSITIES.map((key) => (
				<button
					key={key}
					className={`ci-lib__filter-btn ci-lib__density-btn${value === key ? " is-active" : ""}`}
					onClick={() => onChange(key)}
					aria-pressed={value === key}
					aria-label={density[key]()}
					title={`${density.label()}: ${density[key]()}`}
				>
					{DENSITY_ICON[key]}
				</button>
			))}
		</div>
	);
};
