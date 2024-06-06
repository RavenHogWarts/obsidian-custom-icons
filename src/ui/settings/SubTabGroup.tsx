import { getLocal } from '@/src/i18n/i18n';

interface SubTabGroupProps {
  subTabs: string[];
  activeSubTab: string;
  setActiveSubTab: (subTab: string) => void;
}

const SubTabGroup: React.FC<SubTabGroupProps> = ({ activeSubTab, setActiveSubTab, subTabs }) => {
  if (subTabs.length === 0) {
    return null;
  }

  return (
    <div className="csbi-setting-subTab-group">
      {subTabs.map(subTab => (
        <div 
          key={subTab} 
          className={`csbi-subTab ${activeSubTab === subTab ? 'active' : ''}`}
          onClick={() => setActiveSubTab(subTab)}
        >
          {getLocal()[subTab]}
        </div>
      ))}
    </div>
  );
};

export default SubTabGroup;