import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Bookmark, SidebarData, SidebarSettings, defaultData } from '../utils/types';
import { loadData, saveData, exportData, importData, generateId } from '../utils/storage';

const Sidebar: React.FC = () => {
  const [data, setData] = useState<SidebarData>(defaultData);
  const [isVisible, setIsVisible] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newBookmark, setNewBookmark] = useState({ title: '', url: '' });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData().then(setData);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPinned || !data.settings.autoHide) return;
      
      const triggerWidth = data.settings.triggerWidth;
      const isLeft = data.settings.position === 'left';
      
      if (isLeft) {
        setIsVisible(e.clientX <= triggerWidth);
      } else {
        setIsVisible(e.clientX >= window.innerWidth - triggerWidth);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [data.settings, isPinned]);

  const updateData = useCallback(async (newData: SidebarData) => {
    setData(newData);
    await saveData(newData);
  }, []);

  const addBookmark = async () => {
    if (!newBookmark.title || !newBookmark.url) return;
    
    const bookmark: Bookmark = {
      id: generateId(),
      title: newBookmark.title,
      url: newBookmark.url.startsWith('http') ? newBookmark.url : `https://${newBookmark.url}`,
      favicon: `https://www.google.com/s2/favicons?domain=${newBookmark.url}&sz=32`,
      createdAt: Date.now(),
    };
    
    await updateData({
      ...data,
      bookmarks: [...data.bookmarks, bookmark],
    });
    setNewBookmark({ title: '', url: '' });
  };

  const deleteBookmark = async (id: string) => {
    await updateData({
      ...data,
      bookmarks: data.bookmarks.filter(b => b.id !== id),
    });
  };

  const updateSettings = async (settings: Partial<SidebarSettings>) => {
    await updateData({
      ...data,
      settings: { ...data.settings, ...settings },
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importData(file);
      await updateData(imported);
      alert('Data imported successfully!');
    } catch {
      alert('Failed to import data');
    }
  };

  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    [data.settings.position]: isVisible || isPinned ? 0 : '-320px',
    width: '300px',
    height: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#fff',
    padding: '16px',
    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
    transition: 'all 0.3s ease',
    zIndex: 2147483647,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflowY: 'auto',
    boxSizing: 'border-box',
  };

  return (
    <div ref={sidebarRef} style={sidebarStyle}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" fill="#1a1a2e"/>
            <path d="M30 60 Q50 30 70 60 Q50 45 30 60" fill="#4a9eff"/>
            <path d="M35 55 L50 35 L65 55" stroke="#ff6b6b" strokeWidth="3" fill="none"/>
            <circle cx="42" cy="48" r="3" fill="#fff"/>
            <circle cx="58" cy="48" r="3" fill="#fff"/>
          </svg>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Shark Eagle</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setIsPinned(!isPinned)} style={{ background: isPinned ? '#4a9eff' : '#333', border: 'none', borderRadius: '4px', padding: '6px', cursor: 'pointer', color: '#fff' }} title={isPinned ? 'Unpin' : 'Pin'}>
            📌
          </button>
          <button onClick={() => setShowSettings(!showSettings)} style={{ background: '#333', border: 'none', borderRadius: '4px', padding: '6px', cursor: 'pointer', color: '#fff' }}>
            ⚙️
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#888' }}>SETTINGS</h4>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Position</label>
            <select value={data.settings.position} onChange={(e) => updateSettings({ position: e.target.value as 'left' | 'right' })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none', background: '#333', color: '#fff' }}>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={data.settings.autoHide} onChange={(e) => updateSettings({ autoHide: e.target.checked })} />
              Auto-hide sidebar
            </label>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => exportData(data)} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: 'none', background: '#4a9eff', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>
              Export
            </button>
            <button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: 'none', background: '#333', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>
              Import
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </div>
        </div>
      )}

      {/* Add Bookmark Form */}
      <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
        <input type="text" placeholder="Title" value={newBookmark.title} onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: 'none', background: '#333', color: '#fff', boxSizing: 'border-box' }} />
        <input type="text" placeholder="URL" value={newBookmark.url} onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addBookmark()} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: 'none', background: '#333', color: '#fff', boxSizing: 'border-box' }} />
        <button onClick={addBookmark} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: 'none', background: '#4a9eff', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
          + Add Bookmark
        </button>
      </div>

      {/* Bookmarks List */}
      <div>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#888' }}>BOOKMARKS ({data.bookmarks.length})</h4>
        {data.bookmarks.map((bookmark) => (
          <div key={bookmark.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#1a1a1a', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer' }} onClick={() => window.open(bookmark.url, '_blank')}>
            {bookmark.favicon && <img src={bookmark.favicon} alt="" style={{ width: '20px', height: '20px' }} />}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: '500', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bookmark.title}</div>
              <div style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bookmark.url}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); deleteBookmark(bookmark.id); }} style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '4px' }}>
              ✕
            </button>
          </div>
        ))}
        {data.bookmarks.length === 0 && (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px', fontSize: '13px' }}>
            No bookmarks yet. Add your first one above!
          </div>
        )}
      </div>
    </div>
  );
};

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    const container = document.createElement('div');
    container.id = 'shark-eagle-sidebar-root';
    document.body.appendChild(container);
    
    const root = createRoot(container);
    root.render(<Sidebar />);
  },
});
