import { useEffect, useState } from "react";
import { CustomIconsConfig, ExtraProps, IconDetail } from "@/src/manager/types";
import DefaultIconDetailForm from "./DefaultIconDetailForm";
import IconsDetailForm from "./IconsDetailForm";
import DefaultIconForm from "./DefaultIconForm";
import IconsForm from "./IconsForm";


function SubComponentForm(props: {
  configKey: keyof CustomIconsConfig;
  extraProps: ExtraProps;
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
      <DefaultIconForm 
        configKey={configKey}
        defaultIconConfig={defaultIcon}
        onChange={handleDefaultIconChange}
      />
      <IconsForm 
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