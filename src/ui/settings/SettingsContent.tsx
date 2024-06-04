import React from 'react';
import SubTabGroup from "@/src/ui/settings/SubTabGroup";

interface SettingsContentProps {
  activeTab: string;
  activeSubTab: string;
  setActiveSubTab: (subTab: string) => void;
}

const SettingsContent: React.FC<SettingsContentProps> = ({ activeTab, activeSubTab, setActiveSubTab }) => {
  let subTabs: string[] = [];
  let ContentComponent: React.FC | null = null;

  switch(activeTab){
    case 'SidebarTab':
      subTabs = ['SidebarSubTab1', 'SidebarSubTab2'];
      // ContentComponent = activeSubTab === 'SidebarSubTab1' ? YourSubTabContent1 : YourSubTabContent2;
      break;
      case 'FolderTab':
        subTabs = ['FolderSubTab1', 'FolderSubTab2'];
        break;
      case 'EditorTab':
        subTabs = ['EditorSubTab1', 'EditorSubTab2'];
        break;
      case 'AboutTab':
        // subTabs = [''];
        break;
      default:
        ContentComponent = null;
  }

  return(
    <div
      className='csbi-setting-content'
    >
      {subTabs.length > 0 && 
        <SubTabGroup 
          activeSubTab={activeSubTab} 
          setActiveSubTab={setActiveSubTab} 
          subTabs={subTabs}
        />
      }
      {ContentComponent}
    </div>
  );
}

export default SettingsContent;