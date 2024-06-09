import { IconDetail, IconsConfig } from "@/src/manager/types";
import { DEFAULT_SETTINGS } from '@/src/setting/defaultSetting';

function DefaultIconDetailForm(porps:{
  iconsConfig: IconsConfig;
  defaultIconConfig: IconDetail;
  onChange: (value: IconsConfig) => void;
}):JSX.Element {
  const { iconsConfig, defaultIconConfig, onChange } = porps;
  const handleReset = () => {
    
  }

  return(
    <></>
  );
}