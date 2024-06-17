import { IconType } from "@/src/manager/types";
import { getResourcePathWithType } from "@/src/util/path";
import DynamicIcon from "./DynamicIcon";

function IconsDispaly(props:{
  src: string;
  type: IconType;
}):JSX.Element {
  const { src, type } = props;

  const iconSrc = getResourcePathWithType(src, type);

  switch (type) {
    case "svg": 
      return(
        <div className="form-image-preview" dangerouslySetInnerHTML={{__html: iconSrc}}/>
      );
    case "lucide":
      return(
        <div className="form-image-preview">
          <DynamicIcon name={iconSrc} />
        </div>
      );
    default:
      return(
        <div className="form-image-preview">
          <img src={iconSrc} alt={type} />
        </div>
      );
  }
}

export default IconsDispaly;