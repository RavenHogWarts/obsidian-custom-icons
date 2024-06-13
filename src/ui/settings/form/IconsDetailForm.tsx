import { useState } from "react";
import { CustomIconsConfig, DefaultIconConfig, ExtraProps, IconDetail, IconType } from "@/src/manager/types";
import { convertCamelCaseToKebabCase } from "@/src/util/case";
import DynamicIcon from '@/src/ui/componets/DynamicIcon';
import IconsDispaly from "../../componets/IconsDispaly";
import IconSelector from "../../componets/IconSelector";

function IconsDetailForm(props:{
  configKey: keyof CustomIconsConfig;
  extraProps: ExtraProps;
  iconConfig: IconDetail[];
  currentDefaultIconConfig: IconDetail;
  onChange: (newIcon: IconDetail[]) => void;
}):JSX.Element {
  const { configKey, extraProps, iconConfig, currentDefaultIconConfig, onChange } = props;
  const [selectedIcons, setSelectedIcons] = useState({});

  const handleRemove = (rule: IconDetail) => {
    const newIconConfig = iconConfig.filter((item) => item.id!== rule.id);
    onChange(newIconConfig);
  }
  const handleAdd = () => {
    const newIndex = iconConfig.length > 0 ? iconConfig[iconConfig.length - 1].sort + 1 : 0;
    const { image, type } = currentDefaultIconConfig;
    const newIcon = {
      ...new DefaultIconConfig(configKey),
      image,
      type,
      sort: newIndex,
      [extraProps]: '',
    };
    const newIconConfig = [...iconConfig, newIcon];
    onChange(newIconConfig);
  };
  const handleMove = (index: number, direction: 'up' | 'down') => {
    let newIconConfig = [...iconConfig];
    if ((direction === 'up' && index > 0) || (direction === 'down' && index < newIconConfig.length - 1)) {
      if (direction === 'up') {
        [newIconConfig[index - 1], newIconConfig[index]] = [newIconConfig[index], newIconConfig[index - 1]];
      } else {
        [newIconConfig[index], newIconConfig[index + 1]] = [newIconConfig[index + 1], newIconConfig[index]];
      }
      newIconConfig.forEach((item, idx) => item.sort = idx);
      newIconConfig.sort((a, b) => a.sort - b.sort);
      onChange(newIconConfig);
    }
  };
  const handleSrcChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newIconConfig = [...iconConfig];
    newIconConfig[index] = {
     ...newIconConfig[index],
      image: {
       ...newIconConfig[index].image,
        src: e.target.value
      }
    };
    onChange(newIconConfig);
  }
  const handleIconSelect = (id: string, iconName: string) => {
    const newIconConfig = iconConfig.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          image: {
            ...item.image,
            src: convertCamelCaseToKebabCase(iconName)
          }
        };
      }
      return item;
    });
    onChange(newIconConfig);
  };
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>, index: number) => {
    const newIconConfig = [...iconConfig];
    newIconConfig[index] = {
     ...newIconConfig[index],
      type: e.target.value as IconType
    };
    onChange(newIconConfig);
  }
  const handleExtraPropsChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = extraProps === 'extension' ? e.target.value.split(',') : e.target.value;
    const newIconConfig = [...iconConfig];
    newIconConfig[index] = {
     ...newIconConfig[index],
      [extraProps]: value
    };
    onChange(newIconConfig);
  }
  return(
    <>
      {iconConfig.map((rule, index) => {
        const extraPropsValue = extraProps === 'extension' ? (rule[extraProps] || []).join(',') : rule[extraProps] || '';
        return(
          <div className='form-item' key={index}>
            <div className='form-toolbar'>
              <div className='form-label'>{rule.id}</div>
              <div className='form-tools'>
                <div className='menu-item ci-up' onClick={() => handleMove(index, 'up')}>
                  <DynamicIcon name='ChevronUp'/>
                </div>
                <div className='menu-item ci-down' onClick={() => handleMove(index, 'down')}>
                  <DynamicIcon name='ChevronDown'/>
                </div>
              </div>
            </div>
            <div className='form-content'>
              <div className='form-iconSetting'>
                <>
                  <IconsDispaly src={rule.image.src} type={rule.type} />
                </>
                <input 
                  type='text'
                  placeholder='Image Source'
                  value={rule.image.src}
                  onChange={(e) => handleSrcChange(e, index)}
                />
                <select
                  className='select'
                  value={rule.type}
                  onChange={(e) => {handleTypeChange(e, index)}}
                >
                  <option value="lucide">Lucide</option>
                  <option value="local">Local</option>
                  <option value="url">URL</option>
                  <option value="svg">SVG</option>
                  <option value="base64">Base64</option>
                </select>
                {rule.type === 'lucide' && 
                  <IconSelector onSelect={(iconName) => handleIconSelect(rule.id, iconName)} />
                }
              </div>
              <div className='form-labelSetting'>
                <input 
                  type='text'
                  placeholder={extraProps}
                  value={extraPropsValue}
                  onChange={(e) => handleExtraPropsChange(e, index)}
                />
                <div className='menu-item ci-remove' onClick={() => handleRemove(rule)}>
                  <DynamicIcon name='Trash2'/>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div className='menu-item ci-add'>
        <button onClick={handleAdd}>
          <DynamicIcon name='Plus'/>
        </button>
      </div>
    </>
  );
}

export default IconsDetailForm;