import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { autoUpdate, useFloating } from '@floating-ui/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { icons } from 'lucide-react';
import DynamicIcon from '../../componets/DynamicIcon';
import { convertCamelCaseToKebabCase, convertKebabCaseToCamelCase } from '@/src/util/case';
import { IconType } from '@/src/manager/types';

function LucideIconPanel(props: {
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
  const [query, setQuery] = useState("");

  const { refs, floatingStyles } = useFloating({
    open: showIcon,
    onOpenChange: onOpenChange,
    placement: 'right-start',
    whileElementsMounted: autoUpdate,
    elements: {
      reference: anchorElement,
    },
  });
  
  const iconPanelRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredIcons = useMemo(() => {
    if (!query) return Object.keys(icons);
  
    const queryCamelCase = convertKebabCaseToCamelCase(query);
    const queryLowerCase = query.toLowerCase();
    const queryCamelCaseLower = queryCamelCase.toLowerCase();
  
    return Object.keys(icons).filter(iconName => {
      const iconNameKebabCase = convertCamelCaseToKebabCase(iconName).toLowerCase();
      const iconNameLowerCase = iconName.toLowerCase();
  
      return iconNameKebabCase.includes(queryLowerCase) || 
             iconNameLowerCase.includes(queryCamelCaseLower) || 
             iconNameLowerCase.includes(queryLowerCase);
    });
  }, [query]);

  const iconRows = useMemo(() => {
    const rows = [];
    const rowSize = 5;
    for (let i = 0; i < filteredIcons.length; i += rowSize) {
      rows.push(filteredIcons.slice(i, i + rowSize));
    }
    return rows;
  }, [filteredIcons]);

  const onRandom = () => {
    const randomIcon = filteredIcons[Math.floor(Math.random() * filteredIcons.length)];
    onIconSelect(randomIcon);
  };

  const rowVirtualizer = useVirtualizer({
    count: iconRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  useEffect(() => {
    if (showIcon && parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [showIcon]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showIcon && anchorElement && !anchorElement.contains(e.target as Node) 
        && iconPanelRef.current && !iconPanelRef.current.contains(e.target as Node)) {
        onOpenChange?.(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIcon]);

  return (
    <>
      {showIcon && (
        <div className='ci-floating-container' ref={refs.setFloating} style={{...floatingStyles}}>
          <div className='iconPanel' ref={iconPanelRef}>
            <select
              className='select'
              value={type}
              onChange={onTypeSelect}
            >
              <option value="lucide">Lucide</option>
              <option value="local">Local</option>
              <option value="url">URL</option>
              <option value="svg">SVG</option>
              <option value="base64">Base64</option>
            </select>
            <input
              type="text"
              placeholder="Image Source"
              value={src}
              onChange={onSrcSelect}
            />
            {type === 'lucide' && 
              <>
                <div className='iconPanel-Header'>
                  <div className='iconPanel-Search'>
                    <input className='iconPanel-Search-Input'
                      type='text'
                      placeholder='Search icons...'
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <div className='iconPanel-Random' aria-label='Random Icon' onClick={onRandom}>
                    <DynamicIcon name='Dices'/>
                  </div>
                </div>
                <div className='iconPanel-Body' ref={parentRef}>
                  <div className='iconPanel-Body-Inner' style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                  }}>
                    {rowVirtualizer.getVirtualItems().map(virtualRow => (
                      <div key={virtualRow.index} style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}>
                        <div className='iconPanel-Row'>
                          {iconRows[virtualRow.index].map(iconName => (
                            <div key={iconName} className='iconPanel-Cell' aria-label={convertCamelCaseToKebabCase(iconName)} onClick={() => onIconSelect(iconName)}>
                              <DynamicIcon name={iconName}/>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>  
            }
          </div>
        </div>
      )}
    </>
  );
}

export default LucideIconPanel;