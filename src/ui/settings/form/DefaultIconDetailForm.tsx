import { CustomIconsConfig, IconDetail, IconsConfig, IconType } from "@/src/manager/types";
import { DEFAULT_SETTINGS } from '@/src/setting/defaultSetting';
import { getResourcePathWithType } from '@/src/util/path';
import DynamicIcon from '@/src/ui/componets/DynamicIcon';
import IconsDispaly from "../../componets/IconsDispaly";

function DefaultIconDetailForm(porps:{
  configKey: keyof CustomIconsConfig;
  defaultIconConfig: IconDetail;
  onChange: (newIcon: IconDetail) => void;
}):JSX.Element {
  const { configKey, defaultIconConfig, onChange } = porps;
  const handleReset = () => {
    const newIconConfig = DEFAULT_SETTINGS[configKey].defaultIcon;
    onChange(newIconConfig);
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
  }
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
            <DynamicIcon name="rotate-cw"/>
          </div>
        </div>
      </div>
      <div className='form-content'>
        <div className='form-iconSetting'>
          <div className='image-preview'>
            <IconsDispaly src={defaultIconConfig.image.src} type={defaultIconConfig.type}/>
          </div>
          <input
            type="text"
            placeholder="Image Source"
            value={defaultIconConfig.image.src}
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
        </div>
      </div>
    </div>
  );
}

export default DefaultIconDetailForm;