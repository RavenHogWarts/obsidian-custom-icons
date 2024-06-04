import React from 'react';

const SettingsTitle: React.FC<{ title: string, tip: string }> = ({ title, tip }) => {
  return (
    <div
      className='csbi-setting-title'
    >
      <h1>{title}</h1>
      <div
        className='csbi-setting-tip'
      >
        <h6>{tip}</h6>
      </div>
    </div>
  );
};

export default SettingsTitle;