import React from 'react';

interface SubContentProps {
  activeTab: string;
  activeSubTab: string;
}

const SubContent: React.FC<SubContentProps> = ({ activeTab, activeSubTab }) => {
  const renderContent = () => {
    return <div>Content for {activeSubTab} under {activeTab}</div>;
  };

  return (
    <div className="sub-content">
      {renderContent()}
    </div>
  );
};

export default SubContent;