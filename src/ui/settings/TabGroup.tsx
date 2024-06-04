import React from 'react';

interface TabGroupProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: string[];
}

const TabGroup: React.FC<TabGroupProps> = ({ activeTab, setActiveTab, tabs }) => {
  return (
    <nav
      className='csbi-setting-header'
    >
      <div
        className='csbi-setting-tab-group'
      >
        {tabs.map(tab => (
          <div 
            key={tab} 
            className={`csbi-tab ${activeTab === tab ? 'csbi-tab-active' : ''}`} 
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>
      <div
        className='csbi-fill'
      >
      </div>
    </nav>
  );
};

export default TabGroup;