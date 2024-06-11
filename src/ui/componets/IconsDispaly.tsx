import { IconType, LucideIconName } from "@/src/manager/types";
import { getResourcePathWithType, getThemeColorVariable } from "@/src/util/path";
import DynamicIcon from "./DynamicIcon";

function IconsDispaly(props:{
  src: string | LucideIconName;
  type: IconType;
}):JSX.Element {
  const { src, type } = props;

  const iconSrc = getResourcePathWithType(src, type);

  switch (type) {
    case "lucide":
      return(
        <DynamicIcon name={iconSrc as LucideIconName} color={getThemeColorVariable('--tab-text-color-focused-active')}/>
      );
    default:
      return(
        <img src={iconSrc} alt={type} />
      );
  }
}

export default IconsDispaly;