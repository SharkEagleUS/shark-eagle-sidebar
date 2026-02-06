import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Shark Eagle Sidebar',
    description: 'A customizable sidebar for managing your favorite bookmarks',
    version: '1.0.0',
    permissions: ['storage', 'activeTab'],
    icons: {
      '16': 'icon/16.png',
      '32': 'icon/32.png',
      '48': 'icon/48.png',
      '128': 'icon/128.png',
    },
  },
  webExt: {
    startUrls: ['https://hzhou.me/2020/12/24/SaltyNote-Server-Setup/']
  }
});
