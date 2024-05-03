export const EMPTY_PNG_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
export const DEFAULT_FOLDER_ICON = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNyb3duIj48cGF0aCBkPSJNMTEuNTYyIDMuMjY2YS41LjUgMCAwIDEgLjg3NiAwTDE1LjM5IDguODdhMSAxIDAgMCAwIDEuNTE2LjI5NEwyMS4xODMgNS41YS41LjUgMCAwIDEgLjc5OC41MTlsLTIuODM0IDEwLjI0NmExIDEgMCAwIDEtLjk1Ni43MzRINS44MWExIDEgMCAwIDEtLjk1Ny0uNzM0TDIuMDIgNi4wMmEuNS41IDAgMCAxIC43OTgtLjUxOWw0LjI3NiAzLjY2NGExIDEgMCAwIDAgMS41MTYtLjI5NHoiLz48cGF0aCBkPSJNNSAyMWgxNCIvPjwvc3ZnPg=="
export interface CustomIconSettings {
    customIcons: Array<SidebarIcons>;
    SidebarIcons: Array<SidebarIcons>;
    FolderIcons: Array<FolderIcons>;
    DefaultFolderIcon: Array<DefaultFolderIcon>;
}

export interface DefaultFolderIcon {
    image: string;
    type: string;
}

export interface SidebarIcons {
    id: string;
    label: string;
    image: string;
    type: string;
}

export interface FolderIcons {
    id: string;
    path: string;
    image: string;
    type: string;
}
  
export const DEFAULT_SETTINGS: CustomIconSettings = {
    DefaultFolderIcon: [{ image: "crown", type: "lucide" }],
    SidebarIcons: [],
    FolderIcons: [],
    customIcons: []
}