export interface CustomIconSettings {
    customIcons: Array<{
        id: string; 
        label: string; 
        image: string;
        type: string;
    }>;
}
  
export const DEFAULT_SETTINGS: CustomIconSettings = {
    customIcons: []
}

export const EMPTY_PNG_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
