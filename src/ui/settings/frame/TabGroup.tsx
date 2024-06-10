import SubTabGroup from "./SubTabGroup";
import { getLocal } from '@/src/i18n/i18n';

interface TabGroupProps {
  tabs: string[],
  activeTab: string,
  setActiveTab: (tab: string) => void,
  activeSubTab: string,
  setActiveSubTab: (subTab: string) => void
}

const tabToSubTabsMapping: {[key: string]: string[]} = {
  SidebarTab: ["sidePinFileTab"],
  FolderTab: ["navFileTab", "navFolderTab"],
  EditorTab: ["EditorSubTab1"],
  AboutTab: []
};

const TabGroup: React.FC<TabGroupProps> = ({ tabs, activeTab, setActiveTab, activeSubTab, setActiveSubTab }) => {
  const currentSubTabs = tabToSubTabsMapping[activeTab] || [];
  return (
    <nav className="ci-setting-header">
      <div className="ci-setting-tab-group">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`ci-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab);
              setActiveSubTab("");
            }}
          >
            {getLocal()[tab]}
          </div>
        ))}
      </div>
      <div className="ci-fill"></div>
      <SubTabGroup
          subTabs={currentSubTabs}
          activeSubTab={activeSubTab}
          setActiveSubTab={setActiveSubTab}
      />
    </nav>
  );
};

export default TabGroup;