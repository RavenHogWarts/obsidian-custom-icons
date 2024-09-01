import { IconType } from "@/src/manager/types";
import { getResourcePathWithType } from "@/src/util/path";
import DynamicIcon from "./DynamicIcon";

function IconsDispaly(props:{
  src: string;
  type: IconType;
  className?: string;
}):JSX.Element {
  const { src, type, className } = props;

  const iconSrc = getResourcePathWithType(src, type);

  switch (type) {
    // case "svg": 
    //   return(
    //     <div className={className} dangerouslySetInnerHTML={{__html: iconSrc}}/>
    //   );
    case "lucide":
      return(
        <>
          <DynamicIcon name={iconSrc} />
        </>
      );
    default:
      return(
        <>
          <img src={iconSrc} alt={type} />
        </>
      );
  }
}

export default IconsDispaly;