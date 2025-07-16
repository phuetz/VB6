import React, { useEffect, useRef, useState } from 'react';
import { ContextMenuItem } from '../../types/extended';

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  visible: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose, visible }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose]);

  useEffect(() => {
    if (visible && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Adjust position if menu would go off-screen
      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 5;
      }

      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 5;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [visible, x, y]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;

    if (item.submenu) {
      setSubmenuOpen(item.label);
      // Calculate submenu position
      const rect = menuRef.current?.getBoundingClientRect();
      if (rect) {
        setSubmenuPosition({
          x: rect.right,
          y: rect.top,
        });
      }
    } else {
      item.action();
      onClose();
    }
  };

  const handleSubmenuMouseLeave = () => {
    setTimeout(() => {
      setSubmenuOpen(null);
    }, 300);
  };

  if (!visible) return null;

  return (
    <>
      <div
        ref={menuRef}
        className="fixed bg-white border border-gray-400 shadow-lg z-50 min-w-48"
        style={{
          left: x,
          top: y,
          fontFamily: 'MS Sans Serif, sans-serif',
          fontSize: '11px',
        }}
        onMouseLeave={handleSubmenuMouseLeave}
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item.separator ? (
              <div className="border-t border-gray-300 my-1" />
            ) : (
              <div
                className={`px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-blue-500 hover:text-white ${
                  item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => {
                  if (item.submenu) {
                    setSubmenuOpen(item.label);
                  }
                }}
              >
                <div className="flex items-center">
                  {item.icon && <span className="mr-2 w-4 text-center">{item.icon}</span>}
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center ml-4">
                  {item.shortcut && <span className="text-gray-500 text-xs">{item.shortcut}</span>}
                  {item.submenu && <span className="ml-2">▶</span>}
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Submenu */}
      {submenuOpen && (
        <ContextMenu
          x={submenuPosition.x}
          y={submenuPosition.y}
          items={items.find(item => item.label === submenuOpen)?.submenu || []}
          onClose={() => setSubmenuOpen(null)}
          visible={true}
        />
      )}
    </>
  );
};
