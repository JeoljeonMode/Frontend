import { createContext, useContext, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useBackend } from '../../hooks/useBackend';
import { Sidebar } from './Sidebar';
import type { Snapshot } from '../../types';

interface BackendCtx {
  backendConnected: boolean;
  setBackendConnected: (v: boolean) => void;
  current: Snapshot;
  setCurrent: (s: Snapshot) => void;
  events: Snapshot[];
  setEvents: React.Dispatch<React.SetStateAction<Snapshot[]>>;
  pushSnapshot: (s: Snapshot) => void;
}

export const BackendContext = createContext<BackendCtx | null>(null);

export function useBackendContext() {
  const ctx = useContext(BackendContext);
  if (!ctx) throw new Error('useBackendContext must be used within AppLayout');
  return ctx;
}

export function AppLayout() {
  const backend = useBackend();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <BackendContext.Provider value={backend}>
      <div className={`monitor-shell${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
        <main className="dashboard">
          <Outlet />
        </main>
      </div>
    </BackendContext.Provider>
  );
}
