import { useState } from 'react';
import { 
  CustomIconsConfig, 
  defaultIconDetail, 
  iconType, 
  sidebarWorkspaceIconsDetail 
} from '@/src/manager/types';
import { useObsidianApp } from '@/src/ui/context/obsidianAppContext';
import { DEFAULT_SETTINGS } from '@/src/setting/defaultSetting';
import { getResourcePathWithPath } from '@/src/util/path';
import DynamicIcon from '@/src/ui/componets/DynamicIcon';
import { generateUniqueId } from '@/src/util/uuid';

function DefaultIconDetailForm(porps:{
  defaultIconDetail: defaultIconDetail;
  onReset: () => void;
  onChange: (newIcon: defaultIconDetail) => void;
}) {
  const { defaultIconDetail, onReset, onChange,} = porps;

  const handleSrcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({...defaultIconDetail, image: { ...defaultIconDetail.image, src: e.target.value }});
  };
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({...defaultIconDetail, type: e.target.value as iconType});
  };

  return(
    <div className='form-item'>
      <div className='form-toolbar'>
        <div className='form-label'>DefaultIcon Setting</div>
        <div className='form-tools'>
          <div 
            className='menu-item'
            onClick={onReset}
          >
            <DynamicIcon name="rotate-cw"/>
          </div>
        </div>
      </div>
      <div className='form-content'>
        <div className='form-iconSetting'>
          <div className='image-preview'>
            <img
              src={getResourcePathWithPath(defaultIconDetail.image.src, defaultIconDetail.type)}
              alt={defaultIconDetail.type}
            />
          </div>
          <input
            type="text"
            placeholder="Image Source"
            value={defaultIconDetail.image.src || ''}
            onChange={handleSrcChange}
          />
          <select 
            className='select'
            value={defaultIconDetail.type}
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
  sidebarWorkspaceIconsDetail: sidebarWorkspaceIconsDetail[];
  onChange: (newIcon: sidebarWorkspaceIconsDetail) => void;
}) {
  const { sidebarWorkspaceIconsDetail, onChange } = props;
  return(
    <div className='form-item'>
      <div className='form-toolbar'>
        <div className='form-label'>{generateUniqueId('SideWorkspace')}</div>
        <div className='form-tools'>
          <div 
            className='menu-item'
            // onClick={handleSortUpChange}
          >
            <DynamicIcon name='chevron-up'/>
          </div>
          <div 
            className='menu-item'
            // onClick={handleSortDownChange}
          >
            <DynamicIcon name='chevron-down'/>
          </div>
        </div>
      </div>
      <div className='form-content'>
        <div className='form-iconSetting'>
          <div className='image-preview'>
            <img
              src={getResourcePathWithPath("file", "lucide")}
              alt={"lucide"}
            />
          </div>
          <input
            type='text'
            placeholder='Image Source'
            value={"file"}
            // onChange={handleSrcChange}
          />
          <select 
            className='select'
            value={"lucide"}
            // onChange={handleTypeChange}
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
            value='label'
            // onChange={handleLabelChange}
          />
          <div className='menu-item'>
            <DynamicIcon name='trash-2'/>
          </div>
        </div>
      </div>
    </div>
  );

}

function SidebarSubTab1(props: {
  config: CustomIconsConfig;
  onChange: (config: CustomIconsConfig) => void;
}) {
  const app = useObsidianApp();
  const { config, onChange } = props;
  const [sidebarWorkspaceConfig, setSidebarWorkspaceConfig] = useState(props.config.sidebarWorkspaceIcons)

  const handleDefaultIconChange = (newDefaultIcon: defaultIconDetail) =>{
    const newConfig = {
      ...config,
      sidebarWorkspaceIcons: [{
        ...config.sidebarWorkspaceIcons[0],
        defaultIcon: newDefaultIcon,
      }],
    };
    setSidebarWorkspaceConfig(newConfig.sidebarWorkspaceIcons);
    onChange(newConfig);
  }
  const handleDefaultIconReset = () => {
    const resetConfig = {
      ...config,
      sidebarWorkspaceIcons: [{
        ...config.sidebarWorkspaceIcons[0],
        defaultIcon: DEFAULT_SETTINGS.sidebarWorkspaceIcons[0].defaultIcon,
      }]
    };
    setSidebarWorkspaceConfig(resetConfig.sidebarWorkspaceIcons);
    onChange(resetConfig);
  };

  const handleIconChange = (newIcon: sidebarWorkspaceIconsDetail) => {
    const newConfig = {
     ...config,
      sidebarWorkspaceIcons: [{
       ...config.sidebarWorkspaceIcons,
        icons: [...config.sidebarWorkspaceIcons[0].icons, newIcon],
      }],
    };
    setSidebarWorkspaceConfig(newConfig.sidebarWorkspaceIcons);
    onChange(newConfig);
  };

  return(
    <div className='ci-setting-form'>
      {sidebarWorkspaceConfig[0].defaultIcon && (
        <DefaultIconDetailForm
          defaultIconDetail={sidebarWorkspaceConfig[0].defaultIcon}
          onReset={handleDefaultIconReset}
          onChange={handleDefaultIconChange}
        />
      )}
      <SidebarWorkspaceIconsDetailForm
        sidebarWorkspaceIconsDetail={sidebarWorkspaceConfig[0].icons}
        onChange={handleIconChange}
      />
    </div>
  );
}

export default SidebarSubTab1;