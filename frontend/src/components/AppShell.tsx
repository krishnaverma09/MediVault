import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import type { User } from '../types';

interface AppShellProps {
  user: User;
  onLogout: () => void;
  pageTitle: string;
  pageSubtitle?: string;
  children: ReactNode;
}

export default function AppShell({ user, onLogout, pageTitle, pageSubtitle, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        onLogout={onLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {/* Mobile backdrop rendered inside shell for z-index stacking */}
      {sidebarOpen && (
        <div
          style={{
            display: 'none',
          }}
        />
      )}
      <div className="app-content">
        <TopBar
          isDoctor={user.role === "doctor"}
          title={pageTitle}
          subtitle={pageSubtitle}
          onMenuToggle={() => setSidebarOpen(s => !s)}
        />
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
