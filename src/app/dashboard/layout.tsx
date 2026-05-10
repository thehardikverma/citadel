'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { VaultProvider, useVault } from '@/contexts/VaultContext';
import MasterPasswordModal from '@/components/MasterPasswordModal';
import AgentChat from '@/components/AgentChat';
import {
  LayoutDashboard,
  Key,
  FileText,
  FolderOpen,
  Settings,
  Shield,
  LogOut,
  Search,
  Lock,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'passwords', label: 'Passwords', icon: Key, href: '/dashboard/passwords' },
  { id: 'notes', label: 'Secure Notes', icon: FileText, href: '/dashboard/notes' },
  { id: 'files', label: 'Files', icon: FolderOpen, href: '/dashboard/files' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isUnlocked, lock } = useVault();
  const router = useRouter();
  const pathname = usePathname();
  const [showMobile, setShowMobile] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const activeSection = navItems.find(item =>
    pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
  )?.id || 'dashboard';

  if (!isUnlocked) {
    return <MasterPasswordModal />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-primary)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
        className="sidebar-desktop"
      >
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--border-primary)',
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Shield size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>Citadel</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Encrypted Vault</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { router.push(item.href); setShowMobile(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    background: isActive ? 'var(--accent-glow)' : 'transparent',
                    color: isActive ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom actions */}
        <div style={{
          padding: '12px',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <button
            onClick={() => lock()}
            className="btn-ghost"
            style={{ justifyContent: 'flex-start', width: '100%', fontSize: '13px', padding: '10px 12px' }}
          >
            <Lock size={16} />
            Lock Vault
          </button>
          <button
            onClick={handleSignOut}
            className="btn-ghost"
            style={{ justifyContent: 'flex-start', width: '100%', fontSize: '13px', padding: '10px 12px', color: 'var(--danger)' }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        {/* User */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent-primary), #c084fc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {userEmail ? userEmail[0].toUpperCase() : 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {userEmail || 'Loading...'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Free Plan</div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          height: '60px',
          borderBottom: '1px solid var(--border-primary)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setShowMobile(!showMobile)}
              className="btn-ghost"
              style={{ display: 'none', padding: '6px' }}
              id="mobile-menu-btn"
            >
              <Menu size={20} />
            </button>
            <h1 style={{ fontSize: '18px', fontWeight: 600, textTransform: 'capitalize' }}>
              {activeSection === 'dashboard' ? 'Dashboard' : activeSection}
            </h1>
            <span className="badge badge-accent" style={{ fontSize: '10px' }}>
              <Lock size={10} style={{ marginRight: '4px' }} />
              Encrypted
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vault... (Ctrl+K)"
                className="input-base"
                style={{
                  width: '260px',
                  paddingLeft: '32px',
                  fontSize: '13px',
                  padding: '8px 12px 8px 32px',
                  background: 'var(--bg-primary)',
                }}
              />
            </div>

            {/* AI Agent button */}
            <button
              onClick={() => setShowAgent(!showAgent)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius)',
                border: '1px solid rgba(99,102,241,0.2)',
                background: showAgent ? 'var(--accent-glow)' : 'transparent',
                color: showAgent ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
            >
              <Sparkles size={14} />
              AI Agent
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '24px', position: 'relative' }}>
          {children}
        </main>
      </div>

      {/* Agent chat panel */}
      {showAgent && <AgentChat onClose={() => setShowAgent(false)} />}

      {/* Mobile sidebar overlay */}
      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <VaultProvider>
      <DashboardContent>{children}</DashboardContent>
    </VaultProvider>
  );
}
