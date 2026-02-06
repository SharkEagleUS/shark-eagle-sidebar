import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Bookmark, SidebarData, SidebarSettings, defaultData } from '../utils/types';
import { loadData, saveData, exportData, importData, generateId } from '../utils/storage';

const Sidebar: React.FC = () => {
  const [data, setData] = useState<SidebarData>(defaultData);
  const [isVisible, setIsVisible] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBookmark, setNewBookmark] = useState({ title: '', url: '' });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

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
    setShowAddModal(false);
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
    [data.settings.position]: isVisible || isPinned ? 0 : '-60px',
    width: '60px',
    height: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#fff',
    padding: '12px 6px',
    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
    transition: 'all 0.3s ease',
    zIndex: 2147483647,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflowY: 'auto',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  return (
    <>
      <div ref={sidebarRef} style={sidebarStyle}>
        <div style={{ marginBottom: '16px', borderBottom: '1px solid #333', paddingBottom: '10px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" fill="#1a1a2e"/>
            <path d="M30 60 Q50 30 70 60 Q50 45 30 60" fill="#4a9eff"/>
            <path d="M35 55 L50 35 L65 55" stroke="#ff6b6b" strokeWidth="3" fill="none"/>
            <circle cx="42" cy="48" r="3" fill="#fff"/>
            <circle cx="58" cy="48" r="3" fill="#fff"/>
          </svg>
          
          <button 
            onClick={() => setIsPinned(!isPinned)} 
            style={{ 
              background: isPinned ? '#4a9eff' : '#333', 
              border: 'none', 
              borderRadius: '4px', 
              padding: '6px', 
              cursor: 'pointer', 
              color: '#fff',
              fontSize: '14px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} 
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            📌
          </button>
          
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            style={{ 
              background: showSettings ? '#4a9eff' : '#333', 
              border: 'none', 
              borderRadius: '4px', 
              padding: '6px', 
              cursor: 'pointer', 
              color: '#fff',
              fontSize: '14px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ⚙️
          </button>
        </div>

        {showSettings && (
          <div style={{ 
            background: '#1a1a1a', 
            borderRadius: '8px', 
            padding: '8px', 
            marginBottom: '12px',
            width: '200px',
            position: 'absolute',
            left: data.settings.position === 'left' ? '70px' : 'auto',
            right: data.settings.position === 'right' ? '70px' : 'auto',
            top: '100px',
            zIndex: 10
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#888' }}>SETTINGS</h4>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Position</label>
              <select value={data.settings.position} onChange={(e) => updateSettings({ position: e.target.value as 'left' | 'right' })} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', background: '#333', color: '#fff', fontSize: '11px' }}>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={data.settings.autoHide} onChange={(e) => updateSettings({ autoHide: e.target.checked })} />
                Auto-hide
              </label>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
              <button onClick={() => exportData(data)} style={{ padding: '6px', borderRadius: '4px', border: 'none', background: '#4a9eff', color: '#fff', cursor: 'pointer', fontSize: '11px' }}>
                Export
              </button>
              <button onClick={() => fileInputRef.current?.click()} style={{ padding: '6px', borderRadius: '4px', border: 'none', background: '#333', color: '#fff', cursor: 'pointer', fontSize: '11px' }}>
                Import
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </div>
          </div>
        )}

        <button
          ref={addButtonRef}
          onClick={() => setShowAddModal(!showAddModal)}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: 'none',
            background: '#4a9eff',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '22px',
            fontWeight: 'bold',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(74, 158, 255, 0.3)'
          }}
          title="Add Bookmark"
        >
          +
        </button>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          {data.bookmarks.map((bookmark) => (
            <div 
              key={bookmark.id} 
              style={{ 
                position: 'relative',
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                background: '#1a1a1a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }} 
              onClick={() => window.open(bookmark.url, '_blank')}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2a2a2a';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1a1a1a';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={bookmark.title}
            >
              {bookmark.favicon && <img src={bookmark.favicon} alt="" style={{ width: '22px', height: '22px' }} />}
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  deleteBookmark(bookmark.id); 
                }} 
                style={{ 
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: '#ff6b6b', 
                  border: 'none', 
                  color: '#fff', 
                  cursor: 'pointer', 
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = '0';
                }}
              >
                ✕
              </button>
            </div>
          ))}
          {data.bookmarks.length === 0 && (
            <div style={{ textAlign: 'center', color: '#666', padding: '20px 0', fontSize: '11px', width: '100%' }}>
              No bookmarks
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div 
          style={{
            position: 'fixed',
            left: data.settings.position === 'left' ? '70px' : 'auto',
            right: data.settings.position === 'right' ? '70px' : 'auto',
            top: addButtonRef.current ? `${addButtonRef.current.getBoundingClientRect().top}px` : '150px',
            background: '#1a1a1a',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            zIndex: 2147483648,
            width: '280px',
            border: '1px solid #333'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#fff' }}>Add Bookmark</h4>
            <button 
              onClick={() => setShowAddModal(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '0',
                width: '24px',
                height: '24px'
              }}
            >
              ✕
            </button>
          </div>
          <input 
            type="text" 
            placeholder="Title" 
            value={newBookmark.title} 
            onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })} 
            style={{ 
              width: '100%', 
              padding: '10px', 
              marginBottom: '10px', 
              borderRadius: '4px', 
              border: '1px solid #333', 
              background: '#0a0a0a', 
              color: '#fff', 
              boxSizing: 'border-box',
              fontSize: '13px'
            }} 
          />
          <input 
            type="text" 
            placeholder="URL" 
            value={newBookmark.url} 
            onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })} 
            onKeyDown={(e) => e.key === 'Enter' && addBookmark()} 
            style={{ 
              width: '100%', 
              padding: '10px', 
              marginBottom: '12px', 
              borderRadius: '4px', 
              border: '1px solid #333', 
              background: '#0a0a0a', 
              color: '#fff', 
              boxSizing: 'border-box',
              fontSize: '13px'
            }} 
          />
          <button 
            onClick={addBookmark} 
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '4px', 
              border: 'none', 
              background: '#4a9eff', 
              color: '#fff', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              fontSize: '13px'
            }}
          >
            Add Bookmark
          </button>
        </div>
      )}
    </>
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
