import React, {useCallback, useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Bookmark, defaultData, SidebarData, SidebarSettings} from '../utils/types';
import {exportData, generateId, importData, loadData, saveData} from '../utils/storage';

const Sidebar: React.FC = () => {
  const [data, setData] = useState<SidebarData>(defaultData);
  const [isVisible, setIsVisible] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; bookmarkId: string } | null>(null);
  const [editBookmark, setEditBookmark] = useState({ title: '', url: '' });
  const [newBookmark, setNewBookmark] = useState({ title: '', url: '' });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData().then(setData);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPinned || !data.settings.autoHide) return;

      const triggerWidth = data.settings.triggerWidth;
      const sidebarWidth = 60;
      const isLeft = data.settings.position === 'left';

      const isOverSidebar = isLeft
        ? e.clientX <= sidebarWidth
        : e.clientX >= window.innerWidth - sidebarWidth;

      const isNearEdge = isLeft
        ? e.clientX <= triggerWidth
        : e.clientX >= window.innerWidth - triggerWidth;

      if (isOverSidebar || isNearEdge) {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
        setIsVisible(true);
      } else if (isVisible) {
        if (!hideTimeoutRef.current) {
          hideTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
            hideTimeoutRef.current = null;
          }, 500);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [data.settings, isPinned, isVisible]);

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
    setNewBookmark({title: '', url: ''});
    setShowAddModal(false);
  };

  const deleteBookmark = async (id: string) => {
    await updateData({
      ...data,
      bookmarks: data.bookmarks.filter(b => b.id !== id),
    });
    setContextMenu(null);
  };

  const updateBookmark = async () => {
    if (!editingId || !editBookmark.title || !editBookmark.url) return;
    
    await updateData({
      ...data,
      bookmarks: data.bookmarks.map(b => 
        b.id === editingId 
          ? {
              ...b,
              title: editBookmark.title,
              url: editBookmark.url.startsWith('http') ? editBookmark.url : `https://${editBookmark.url}`,
              favicon: `https://www.google.com/s2/favicons?domain=${editBookmark.url}&sz=32`,
            }
          : b
      ),
    });
    setEditingId(null);
    setEditBookmark({ title: '', url: '' });
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, bookmarkId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      bookmarkId
    });
  };

  const handleEditClick = (bookmarkId: string) => {
    const bookmark = data.bookmarks.find(b => b.id === bookmarkId);
    if (bookmark) {
      setEditingId(bookmarkId);
      setEditBookmark({ title: bookmark.title, url: bookmark.url });
      setContextMenu(null);
    }
  };

  const updateSettings = async (settings: Partial<SidebarSettings>) => {
    await updateData({
      ...data,
      settings: {...data.settings, ...settings},
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
        <div style={{
          marginBottom: '16px',
          borderBottom: '1px solid #333',
          paddingBottom: '10px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px'
        }}>
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
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
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
              onContextMenu={(e) => handleContextMenu(e, bookmark.id)}
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
              {bookmark.favicon && <img src={bookmark.favicon} alt="" style={{width: '22px', height: '22px'}}/>}
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
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(74, 158, 255, 0.3)',
            flexShrink: 0
          }}
          title="Add Bookmark"
        >
          +
        </button>

        <button
          ref={settingsButtonRef}
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
            justifyContent: 'center',
            marginTop: '8px',
            flexShrink: 0
          }}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            left: data.settings.position === 'left' ? '70px' : 'auto',
            right: data.settings.position === 'right' ? '70px' : 'auto',
            bottom: addButtonRef.current 
              ? `${window.innerHeight - addButtonRef.current.getBoundingClientRect().top + 10}px` 
              : 'auto',
            background: '#1a1a1a',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            zIndex: 2147483648,
            width: '280px',
            border: '1px solid #333'
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
            <h4 style={{margin: 0, fontSize: '14px', color: '#fff'}}>Add Bookmark</h4>
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
            onChange={(e) => setNewBookmark({...newBookmark, title: e.target.value})}
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
            onChange={(e) => setNewBookmark({...newBookmark, url: e.target.value})}
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

      {showSettings && (
        <div
          style={{
            position: 'fixed',
            left: data.settings.position === 'left' ? '70px' : 'auto',
            right: data.settings.position === 'right' ? '70px' : 'auto',
            bottom: settingsButtonRef.current 
              ? `${window.innerHeight - settingsButtonRef.current.getBoundingClientRect().top + 10}px` 
              : 'auto',
            background: '#1a1a1a',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            zIndex: 2147483648,
            width: '280px',
            border: '1px solid #333'
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
            <h4 style={{margin: 0, fontSize: '14px', color: '#fff'}}>Settings</h4>
            <button
              onClick={() => setShowSettings(false)}
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

          <div style={{marginBottom: '12px'}}>
            <label style={{fontSize: '13px', display: 'block', marginBottom: '6px', color: '#ccc'}}>Position</label>
            <select
              value={data.settings.position}
              onChange={(e) => updateSettings({position: e.target.value as 'left' | 'right'})}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #333',
                background: '#0a0a0a',
                color: '#fff',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div style={{marginBottom: '16px'}}>
            <label style={{fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#ccc'}}>
              <input
                type="checkbox"
                checked={data.settings.autoHide}
                onChange={(e) => updateSettings({autoHide: e.target.checked})}
                style={{width: '16px', height: '16px', cursor: 'pointer'}}
              />
              Auto-hide sidebar
            </label>
          </div>

          <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}>
            <button
              onClick={() => exportData(data)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '4px',
                border: 'none',
                background: '#4a9eff',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              Export Data
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #333',
                background: '#0a0a0a',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              Import Data
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{display: 'none'}}/>
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            background: '#1a1a1a',
            borderRadius: '6px',
            padding: '4px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            zIndex: 2147483649,
            border: '1px solid #333',
            minWidth: '120px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleEditClick(contextMenu.bookmarkId)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2a2a2a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => deleteBookmark(contextMenu.bookmarkId)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              color: '#ff6b6b',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2a2a2a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            🗑️ Delete
          </button>
        </div>
      )}

      {editingId && (
        <div
          style={{
            position: 'fixed',
            left: data.settings.position === 'left' ? '70px' : 'auto',
            right: data.settings.position === 'right' ? '70px' : 'auto',
            top: '50%',
            transform: 'translateY(-50%)',
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
            <h4 style={{ margin: 0, fontSize: '14px', color: '#fff' }}>Edit Bookmark</h4>
            <button
              onClick={() => {
                setEditingId(null);
                setEditBookmark({ title: '', url: '' });
              }}
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
            value={editBookmark.title}
            onChange={(e) => setEditBookmark({ ...editBookmark, title: e.target.value })}
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
            value={editBookmark.url}
            onChange={(e) => setEditBookmark({ ...editBookmark, url: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && updateBookmark()}
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
            onClick={updateBookmark}
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
            Save Changes
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
    root.render(<Sidebar/>);
  },
});
