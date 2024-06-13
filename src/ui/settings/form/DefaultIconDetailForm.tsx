import { useState } from "react";
import { CustomIconsConfig, IconDetail, IconsConfig, IconType } from "@/src/manager/types";
import { DEFAULT_SETTINGS } from '@/src/setting/defaultSetting';
import { convertCamelCaseToKebabCase } from "@/src/util/case";
import DynamicIcon from '@/src/ui/componets/DynamicIcon';
import IconsDispaly from "../../componets/IconsDispaly";
import IconSelector from "../../componets/IconSelector";

function DefaultIconDetailForm(porps:{
  configKey: keyof CustomIconsConfig;
  defaultIconConfig: IconDetail;
  onChange: (newIcon: IconDetail) => void;
}):JSX.Element {
  const { configKey, defaultIconConfig, onChange } = porps;
  const [iconName, setIconName] = useState(defaultIconConfig.image.src);

  const handleReset = () => {
    const newIconConfig = DEFAULT_SETTINGS[configKey].defaultIcon;
    onChange(newIconConfig);
    setIconName(newIconConfig.image.src);
  }
  const handleSrcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIconConfig = {
      ...defaultIconConfig,
      image: {
       ...defaultIconConfig.image,
        src: e.target.value
      }
    }
    onChange(newIconConfig);
    setIconName(e.target.value);
  }
  const handleIconSelect = (selectedIconName: string) => {
    const newIconConfig = {
      ...defaultIconConfig,
      image: {
        ...defaultIconConfig.image,
        src: convertCamelCaseToKebabCase(selectedIconName)
      }
    };
    onChange(newIconConfig);
    setIconName(convertCamelCaseToKebabCase(selectedIconName));
  };
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newIconConfig = {
     ...defaultIconConfig,
      type: e.target.value as IconType
    };
    onChange(newIconConfig);
  };

  return(
    <div className='form-item'>
      <div className='form-toolbar'>
        <div className='form-label'>DefaultIcon Setting</div>
        <div className='form-tools'>
          <div className='menu-item' onClick={() => handleReset()}>
            <DynamicIcon name="RotateCw"/>
          </div>
        </div>
      </div>
      <div className='form-content'>
        <div className='form-iconSetting'>
          <>
            <IconsDispaly src={defaultIconConfig.image.src} type={defaultIconConfig.type}/>
          </>
          <input
            type="text"
            placeholder="Image Source"
            value={iconName}
            onChange={handleSrcChange}
          />
          <select 
            className='select'
            value={defaultIconConfig.type}
            onChange={handleTypeChange}
          >
            <option value="lucide">Lucide</option>
            <option value="local">Local</option>
            <option value="url">URL</option>
            <option value="svg">SVG</option>
            <option value="base64">Base64</option>
          </select>
          {defaultIconConfig.type === 'lucide' && 
            <IconSelector onSelect={handleIconSelect} />
          }
        </div>
      </div>
    </div>
  );
}

export default DefaultIconDetailForm;