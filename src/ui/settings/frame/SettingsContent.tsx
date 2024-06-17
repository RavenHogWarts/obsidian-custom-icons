import { CustomIconsConfig, ExtraProps } from '@/src/manager/types';
import SubComponentForm from '../form/SubComponentForm';
import TabComponentForm from '../form/TabComponentForm';

interface SettingsContentProps {
  activeTab: string;
  activeSubTab: string;
  config: CustomIconsConfig;
  onChange: (config: CustomIconsConfig) => void;
}

const subTabConfigMap: {
  [key: string]: { 
    configKey: keyof CustomIconsConfig; 
    extraProps: ExtraProps; 
  }
} = {
  sidePinFileTab: { configKey: 'sidePinFileIcons', extraProps: 'label' },
  navFolderTab: { configKey: 'navFolderIcons', extraProps: 'path' },
  navFileTab: { configKey: 'navFileIcons', extraProps: 'extension' },
};

const SettingsContent: React.FC<SettingsContentProps> = ({ activeTab, activeSubTab, config, onChange }) => {
  const subTabConfig = subTabConfigMap[activeSubTab];

  return (
    <div className="ci-setting-content">
      {!activeSubTab ? (
        <TabComponentForm />
      ) : subTabConfig ? (
        <SubComponentForm
          configKey={subTabConfig.configKey}
          extraProps={subTabConfig.extraProps}
          iconConfig={config}
          onChange={onChange}
        />
      ) : null}
    </div>
  );
};

export default SettingsContent;