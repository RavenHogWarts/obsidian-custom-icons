import { CustomIconsConfig, DefaultIconConfig, ExtraProps, IconDetail, IconType } from "@/src/manager/types";
import { getResourcePathWithType } from '@/src/util/path';
import DynamicIcon from '@/src/ui/componets/DynamicIcon';
import IconsDispaly from "../../componets/IconsDispaly";

function IconsDetailForm(props:{
  configKey: keyof CustomIconsConfig;
  extraProps: ExtraProps;
  iconConfig: IconDetail[];
  currentDefaultIconConfig: IconDetail;
  onChange: (newIcon: IconDetail[]) => void;
}):JSX.Element {
  const { configKey, extraProps, iconConfig, currentDefaultIconConfig, onChange } = props;

  const handleRemove = (rule: IconDetail) => {
    const newIconConfig = iconConfig.filter((item) => item.id!== rule.id);
    onChange(newIconConfig);
  }
  const handleAdd = () => {
    const { image, type } = currentDefaultIconConfig;
    const newIcon = {
      ...new DefaultIconConfig(configKey),
      image,
      type,
      [extraProps]: '',
    };
    const newIconConfig = [...iconConfig, newIcon];
    onChange(newIconConfig);
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
                <div className='menu-item ci-up'>
                  <DynamicIcon name='chevron-up'/>
                </div>
                <div className='menu-item ci-down'>
                  <DynamicIcon name='chevron-down'/>
                </div>
              </div>
            </div>
            <div className='form-content'>
              <div className='form-iconSetting'>
                <div className='image-preview'>
                  <IconsDispaly src={rule.image.src} type={rule.type} />
                </div>
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
              </div>
              <div className='form-labelSetting'>
                <input 
                  type='text'
                  placeholder={extraProps}
                  value={extraPropsValue}
                  onChange={(e) => handleExtraPropsChange(e, index)}
                />
                <div className='menu-item ci-remove' onClick={() => handleRemove(rule)}>
                  <DynamicIcon name='trash-2'/>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div className='menu-item ci-add'>
        <button onClick={handleAdd}>
          <DynamicIcon name='plus'/>
        </button>
      </div>
    </>
  );
}

export default IconsDetailForm;