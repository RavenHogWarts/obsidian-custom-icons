import React from 'react';

interface SubTabGroupProps {
  activeSubTab: string;
  setActiveSubTab: (subTab: string) => void;
  subTabs: string[];
}

const SubTabGroup: React.FC<SubTabGroupProps> = ({ activeSubTab, setActiveSubTab, subTabs }) => {
  return (
    <nav
      className='csbi-setting-header'
    >
      <div
        className='csbi-setting-sub-tab-group'
      >
        {subTabs.map(subTab => (
          <div 
            key={subTab} 
            className={`csbi-sub-tab ${activeSubTab === subTab ? 'csbi-sub-tab-active' : ''}`} 
            onClick={() => setActiveSubTab(subTab)}
          >
            {subTab}
          </div>
        ))}
      </div>
    </nav>
  );
};

export default SubTabGroup;