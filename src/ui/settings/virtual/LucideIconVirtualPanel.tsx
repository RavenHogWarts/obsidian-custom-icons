import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { icons } from 'lucide-react';
import DynamicIcon from '../../componets/DynamicIcon';
import { convertCamelCaseToKebabCase, convertKebabCaseToCamelCase } from '@/src/util/case';

function LucideIconVirtualPanel(props:{
  showIcon: boolean;
  onIconSelect: (icon: string) => void;
}): JSX.Element {
  const { showIcon, onIconSelect } = props;
  const [query, setQuery] = useState("");
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

  return(
    <>
      <div className='selector-Header'>
        <div className='selector-Search'>
          <input className='selector-Search-Input'
            aria-label='input icon name'
            type='text'
            placeholder='Search icons...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className='selector-Random'
          aria-label='Random Icon'
          onClick={onRandom}
        >
          <DynamicIcon name='Dices'/>
        </div>
      </div>
      <div className='selector-Body' ref={parentRef}>
        <div className='selector-Body-Inner' style={{
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
              <div className='selector-Row'>
                {iconRows[virtualRow.index].map(iconName => (
                  <div key={iconName} 
                    className='selector-Cell' 
                    aria-label={convertCamelCaseToKebabCase(iconName)} onClick={() => onIconSelect(iconName)}
                  >
                    <DynamicIcon name={iconName}/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default LucideIconVirtualPanel;