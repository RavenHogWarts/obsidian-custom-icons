import { useState } from 'react';
import { CustomIconsConfig, DefaultSidebarWorkspaceIconsConfig, IconDetail, IconType} from '@/src/manager/types';
import { useObsidianApp } from '@/src/ui/context/obsidianAppContext';
import { DEFAULT_SETTINGS } from '@/src/setting/defaultSetting';
import { getResourcePathWithPath } from '@/src/util/path';
import DynamicIcon from '@/src/ui/componets/DynamicIcon';

function DefaultIconDetailForm(porps:{
  defaultIconConfig: IconDetail;
  onChange: (newIcon: IconDetail) => void;
}) {
  const { defaultIconConfig, onChange } = porps;

  const handleReset = () => {
    const newIconConfig = DEFAULT_SETTINGS.sidebarWorkspaceIcons.defaultIcon;
    onChange(newIconConfig);
  }
  const handleSrcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIconConfig = {
      ...defaultIconConfig,
      image: {
        ...defaultIconConfig.image,
        src: e.target.value
      }
    };
    onChange(newIconConfig);   
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
            <DynamicIcon name="rotate-cw"/>
          </div>
        </div>
      </div>
      <div className='form-content'>
        <div className='form-iconSetting'>
          <div className='image-preview'>
            <img
              src={getResourcePathWithPath(defaultIconConfig.image.src, defaultIconConfig.type)}
              alt={defaultIconConfig.type}
            />
          </div>
          <input
            type="text"
            placeholder="Image Source"
            value={defaultIconConfig.image.src || ''}
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

function SidebarWorkspaceIconsDetailForm(props: {
  sidebarWorkspaceIconsConfig: IconDetail[];
  onChange: (newIcon: IconDetail[]) => void;
}):JSX.Element {
  const { sidebarWorkspaceIconsConfig, onChange } = props;

  const handleRemove = (rule: IconDetail) => {
    const newIconConfig = sidebarWorkspaceIconsConfig.filter((item) => item.id !== rule.id);
    onChange(newIconConfig);
  }
  const handleAdd = () => {
    const newIconConfig = [
      ...sidebarWorkspaceIconsConfig, 
      new DefaultSidebarWorkspaceIconsConfig()
    ];
    onChange(newIconConfig);
  }
  const handleSrcChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newIconConfig = [...sidebarWorkspaceIconsConfig];
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
    const newIconConfig = [...sidebarWorkspaceIconsConfig];
    newIconConfig[index] = {
      ...newIconConfig[index],
      type: e.target.value as IconType
    };
    onChange(newIconConfig);
  }
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newIconConfig = [...sidebarWorkspaceIconsConfig];
    newIconConfig[index] = {
      ...newIconConfig[index],
      label: e.target.value
    };
    onChange(newIconConfig);
  }

  return (
    <>
      {sidebarWorkspaceIconsConfig.map((rule, index) => {
        return(
          <div className='form-item' key={index}>
            <div className='form-toolbar'>
              <div className='form-label'>{rule.id}</div>
              <div className='form-tools'>
                <div className='menu-item'>
                  <DynamicIcon name='chevron-up'/>
                </div>
                <div className='menu-item'>
                  <DynamicIcon name='chevron-down'/>
                </div>
              </div>
            </div>
            <div className='form-content'>
              <div className='form-iconSetting'>
                <div className='image-preview'>
                  <img
                    src={getResourcePathWithPath(rule.image.src, rule.type)}
                    alt={rule.type}
                  />
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
                  placeholder='Label'
                  value={rule.label}
                  onChange={(e) => handleLabelChange(e, index)}
                />
                <div className='menu-item' onClick={() => handleRemove(rule)}>
                  <DynamicIcon name='trash-2'/>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div>
        <button onClick={handleAdd}>
          添加
        </button>
      </div>
    </>
    
  );  
}

function SidebarSubTab1(props: {
  config: CustomIconsConfig;
  onChange: (config: CustomIconsConfig) => void;
}) {
  const app = useObsidianApp();
  const { config, onChange } = props;
  const [sidebarWorkspaceConfig, setSidebarWorkspaceConfig] = useState(props.config.sidebarWorkspaceIcons)

  const handleDefaultIconChange = (newDefaultIcon: IconDetail) =>{
    const newConfig = {
      ...config,
      sidebarWorkspaceIcons: {
        ...config.sidebarWorkspaceIcons,
        defaultIcon: newDefaultIcon,
      },
    };
    setSidebarWorkspaceConfig(newConfig.sidebarWorkspaceIcons);
    onChange(newConfig);
  }
  const handleIconChange = (newSidebarWorkspaceIcon: IconDetail[]) => {
    const newConfig = {
      ...config,
      sidebarWorkspaceIcons: {
        ...config.sidebarWorkspaceIcons,
        icons: newSidebarWorkspaceIcon,
      },
    };
    setSidebarWorkspaceConfig(newConfig.sidebarWorkspaceIcons);
    onChange(newConfig);
  };

  return(
    <div className='ci-setting-form'>
      <DefaultIconDetailForm
        defaultIconConfig={sidebarWorkspaceConfig.defaultIcon}
        onChange={handleDefaultIconChange}
      />
      <SidebarWorkspaceIconsDetailForm 
        sidebarWorkspaceIconsConfig={sidebarWorkspaceConfig.icons}
        onChange={handleIconChange}
      />
    </div>
  );
}

export default SidebarSubTab1;