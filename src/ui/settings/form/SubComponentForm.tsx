import { useEffect, useState } from "react";
import { CustomIconsConfig, IconDetail } from "@/src/manager/types";
import DefaultIconDetailForm from "./DefaultIconDetailForm";
import IconsDetailForm from "./IconsDetailForm";


function SubComponentForm(props: {
  configKey: keyof CustomIconsConfig;
  extraProps: 'label' | 'path' | 'extension';
  iconConfig: CustomIconsConfig;
  onChange: (newIcon: CustomIconsConfig) => void;
}) {
  const { configKey, extraProps, iconConfig, onChange } = props;

  const [defaultIcon, setDefaultIcon] = useState(iconConfig[configKey].defaultIcon);
  const [icons, setIcons] = useState(iconConfig[configKey].icons);

  useEffect(() => {
    setDefaultIcon(iconConfig[configKey].defaultIcon);
    setIcons(iconConfig[configKey].icons);
  }, [iconConfig, configKey]);

  const handleDefaultIconChange = (newDefaultIcon: IconDetail) => {
    setDefaultIcon(newDefaultIcon);
    onChange({
      ...iconConfig,
      [configKey]: {
        ...iconConfig[configKey],
        defaultIcon: newDefaultIcon,
        icons: icons
      },
    });
  };

  const handleIconChange = (newIcons: IconDetail[]) => {
    setIcons(newIcons);
    onChange({
      ...iconConfig,
      [configKey]: {
        ...iconConfig[configKey],
        defaultIcon: defaultIcon,
        icons: newIcons,
      },
    });
  };

  return (
    <div className='ci-setting-form'>
      <DefaultIconDetailForm 
        configKey={configKey}
        defaultIconConfig={defaultIcon}
        onChange={handleDefaultIconChange}
      />
      <IconsDetailForm 
        configKey={configKey}
        extraProps={extraProps}
        iconConfig={icons}
        currentDefaultIconConfig={defaultIcon}
        onChange={handleIconChange}
      />
    </div>
  );
}

export default SubComponentForm;