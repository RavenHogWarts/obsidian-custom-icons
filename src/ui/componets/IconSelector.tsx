import { useRef, useState } from "react";
import { IconType } from "@/src/manager/types";
import IconsDispaly from "./IconsDispaly";
import IconFloatingPanel from "../settings/floating/IconFloatingPanel";

function IconSelector(props:{
  src: string;
  type: IconType;
  onSrcSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTypeSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onIconSelect: (icon: string) => void;
}) {
  const { src, type, onSrcSelect, onTypeSelect, onIconSelect } = props;
  const menuRef = useRef<HTMLDivElement>(null);
  const [showIcon, setShowIcon] = useState(false);

  const handleIconSelect = () => {
    setShowIcon(!showIcon);
  }

  return(
    <>
      <div className="form-image" ref={menuRef} onClick={handleIconSelect} aria-label="select icon">
        <IconsDispaly src={src} type={type} />
      </div>
      {menuRef.current && (
        <IconFloatingPanel 
          showIcon={showIcon}
          anchorElement={menuRef.current}
          onOpenChange={handleIconSelect}
          src={src}
          type={type}
          onSrcSelect={onSrcSelect}
          onTypeSelect={onTypeSelect}
          onIconSelect={onIconSelect}
        />
      )}
    </>
  );
}

export default IconSelector;