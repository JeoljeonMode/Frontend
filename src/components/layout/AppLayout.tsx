import { createContext, useContext, useState } from 'react';
import { Menu } from 'lucide-react';
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

/* Slot that pages can inject content into the mobile topbar right side */
interface TopbarSlotCtx {
  setTopbarRight: (node: React.ReactNode) => void;
}
export const TopbarSlotContext = createContext<TopbarSlotCtx>({ setTopbarRight: () => {} });

export function AppLayout() {
  const backend = useBackend();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [topbarRight, setTopbarRight] = useState<React.ReactNode>(null);

  return (
    <BackendContext.Provider value={backend}>
      <TopbarSlotContext.Provider value={{ setTopbarRight }}>
        <div className={`monitor-shell${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
          <Sidebar
            open={sidebarOpen}
            onToggle={() => setSidebarOpen((v) => !v)}
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
          {mobileMenuOpen && (
            <div className="sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
          )}
          <main className="dashboard">
            <div className="mobile-topbar">
              <button
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="메뉴 열기"
              >
                <Menu size={20} />
              </button>
              <span className="mobile-title">BedSafe AI</span>
              <div className="mobile-topbar-right">{topbarRight}</div>
            </div>
            <Outlet />
          </main>
        </div>
      </TopbarSlotContext.Provider>
    </BackendContext.Provider>
  );
}
