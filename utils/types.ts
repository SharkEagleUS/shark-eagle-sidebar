export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  createdAt: number;
}

export interface SidebarSettings {
  position: 'left' | 'right';
  autoHide: boolean;
  triggerWidth: number;
  toggleKey: string;
}

export interface SidebarData {
  bookmarks: Bookmark[];
  settings: SidebarSettings;
}

export const defaultSettings: SidebarSettings = {
  position: 'left',
  autoHide: true,
  triggerWidth: 10,
  toggleKey: 'Alt',
};

export const defaultData: SidebarData = {
  bookmarks: [],
  settings: defaultSettings,
};
