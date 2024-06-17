import { useState } from "react";
import { CustomIconsConfig, IconDetail, IconsConfig, IconType } from "@/src/manager/types";
import { DEFAULT_SETTINGS } from '@/src/setting/defaultSetting';
import { convertCamelCaseToKebabCase } from "@/src/util/case";
import DynamicIcon from '@/src/ui/componets/DynamicIcon';
import IconSelector from "../../componets/IconSelector";

function DefaultIconForm(porps:{
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
    <div className="default-icon-form">
      <div className="form-title">DefaultIcon Setting</div>
      <div className="form-item">
        <div className='form-content'>
          <IconSelector 
            src={defaultIconConfig.image.src}
            type={defaultIconConfig.type}
            onSrcSelect={handleSrcChange}
            onTypeSelect={handleTypeChange}
            onIconSelect={handleIconSelect}
          />
        </div>
        <div className='form-tools'>
          <div className='menu-item ci-reset' 
            aria-label='Reset'
            onClick={() => handleReset()}
          >
            <DynamicIcon name="RotateCw"/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DefaultIconForm;