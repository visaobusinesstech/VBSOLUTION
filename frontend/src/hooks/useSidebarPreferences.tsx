
import { useState, useEffect } from 'react';

export type SidebarMode = 'hover' | 'click';

export const useSidebarPreferences = () => {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    const saved = localStorage.getItem('sidebar-mode');
    return (saved as SidebarMode) || 'click'; // Mudei para 'click' como padrão
  });

  useEffect(() => {
    localStorage.setItem('sidebar-mode', sidebarMode);
  }, [sidebarMode]);

  const toggleSidebarMode = () => {
    setSidebarMode(prev => prev === 'hover' ? 'click' : 'hover');
  };

  return {
    sidebarMode,
    setSidebarMode,
    toggleSidebarMode
  };
};
