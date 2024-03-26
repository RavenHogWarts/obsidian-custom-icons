export interface CustomIconSettings {
    customIcons: Array<{id: string; label: string; svgData: string;}>;
}
  
export const DEFAULT_SETTINGS: CustomIconSettings = {
    customIcons: []
}