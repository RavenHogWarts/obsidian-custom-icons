import { useEffect, useRef, useState } from "react";
import DynamicIcon from "./DynamicIcon";
import LucideIconPanel from "../settings/frame/LucideIconPanel";

function IconSelector(props:{
  onSelect: (icon: string) => void;
}) {
  const { onSelect } = props;
  const menuRef = useRef<HTMLDivElement>(null);
  const [showIcon, setShowIcon] = useState(false);

  const handleIconSelect = () => {
    setShowIcon(!showIcon);
  }

  return(
    <>
      <div className='menu-item ci-select' ref={menuRef} onClick={handleIconSelect}>
        <DynamicIcon name='ImagePlus'/>
      </div>
      {menuRef.current && (
      <LucideIconPanel 
        showIcon={showIcon}
        anchorElement={menuRef.current}
        onOpenChange={handleIconSelect}
        onSelect={onSelect}
      />
      )}
    </>
  );
}

export default IconSelector;