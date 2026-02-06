import { SidebarData, defaultData } from './types';

const STORAGE_KEY = 'sharkEagleSidebarData';

export async function loadData(): Promise<SidebarData> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    return result[STORAGE_KEY] || defaultData;
  } catch {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || defaultData;
  }
}

export async function saveData(data: SidebarData): Promise<void> {
  try {
    await chrome.storage.sync.set({ [STORAGE_KEY]: data });
  } catch {
    await chrome.storage.local.set({ [STORAGE_KEY]: data });
  }
}

export function exportData(data: SidebarData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shark-eagle-sidebar-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file: File): Promise<SidebarData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
