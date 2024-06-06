import React from 'react';

interface SettingsTitleProps {
  title: string;
  tips: string;
}

const SettingsTitle: React.FC<SettingsTitleProps> = ({ title, tips }) => {
  return (
    <div
      className='csbi-setting-title'
    >
      <h1>{title}</h1>
      <div
        className='csbi-setting-tip'
      >
        <h6>{tips}</h6>
      </div>
    </div>
  );
};

export default SettingsTitle;