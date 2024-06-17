import { useEffect, useRef } from 'react';
import { autoUpdate, useFloating } from '@floating-ui/react';
import { IconType } from "@/src/manager/types";
import LucideIconVirtualPanel from '../virtual/LucideIconVirtualPanel';

function IconFloatingPanel(props:{
  showIcon: boolean;
  anchorElement: Element;
  onOpenChange?: (open: boolean) => void;
  src: string;
  type: IconType;
  onSrcSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTypeSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onIconSelect: (icon: string) => void;
}): JSX.Element {
  const { showIcon, anchorElement, onOpenChange, src, type, onSrcSelect, onTypeSelect, onIconSelect } = props;

  const { refs, floatingStyles } = useFloating({
    open: showIcon,
    onOpenChange: onOpenChange,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    elements: {
      reference: anchorElement,
    },
  });

  const iconFloatingPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showIcon && anchorElement && !anchorElement.contains(e.target as Node) 
        && iconFloatingPanelRef.current && !iconFloatingPanelRef.current.contains(e.target as Node)) {
        onOpenChange?.(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIcon]);

  return(
    <>
      {showIcon && (
        <div className='ci-floating-container' ref={refs.setFloating} style={{...floatingStyles}}>
          <div className='iconPanel' ref={iconFloatingPanelRef}>
            <div className='iconPanel-Header'>
              <select className='select form-select'
                aria-label='select icon type'
                value={type}
                onChange={onTypeSelect}
              >
                <option value="lucide">Lucide</option>
                <option value="local">Local</option>
                <option value="url">URL</option>
                <option value="svg">SVG</option>
                <option value="base64">Base64</option>
              </select>
              <input className='form-input'
                aria-label='input icon src'
                type="text"
                placeholder="Image Source"
                value={src}
                onChange={onSrcSelect}
              />
            </div>
            {type === 'lucide' && (
              <div className='iconPanel-Body'>
                <LucideIconVirtualPanel 
                  showIcon={showIcon}
                  onIconSelect={onIconSelect}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default IconFloatingPanel;