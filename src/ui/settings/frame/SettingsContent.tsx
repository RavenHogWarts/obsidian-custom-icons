import { CustomIconsConfig } from '@/src/manager/types';
import SubComponentForm from '../form/SubComponentForm';
import TabComponentForm from '../form/TabComponentForm';


interface SettingsContentProps {
  activeTab: string;
  activeSubTab: string;
  config: CustomIconsConfig;
  onChange: (config: CustomIconsConfig) => void;
}

const SettingsContent: React.FC<SettingsContentProps> = ({ activeTab, activeSubTab, config, onChange }) => {
  if (!activeSubTab) {
    return (
      <div className="ci-setting-content">
        <div className="ci-setting-tab-content">
          <TabComponentForm />
        </div>
      </div>
    );
  }
  return (
    <div className="ci-setting-content">
      <div className="ci-setting-subTab-content">
        {activeSubTab === "sidePinFileTab" && (
          <SubComponentForm 
            configKey='sidePinFileIcons'
            extraProps='label'
            iconConfig={config}
            onChange={onChange}
          />
        )}
        {activeSubTab === 'navFolderTab' && (
          <SubComponentForm 
           configKey='navFolderIcons'
           extraProps='path'
           iconConfig={config}
           onChange={onChange}
          />
        )}
        {activeSubTab === 'navFileTab' && (
          <SubComponentForm 
           configKey='navFileIcons'
           extraProps='extension'
           iconConfig={config}
           onChange={onChange}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsContent;