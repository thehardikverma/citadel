'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { VaultProvider, useVault } from '@/contexts/VaultContext';
import MasterPasswordModal from '@/components/MasterPasswordModal';
import AgentChat from '@/components/AgentChat';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Key, FileText, FolderOpen, Settings,
  Shield, LogOut, Lock, Sparkles, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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
  const [collapsed, setCollapsed] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
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

  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden bg-bg-primary">
        {/* Sidebar */}
        <motion.aside
          animate={{ width: sidebarWidth }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex flex-col border-r border-border-primary bg-bg-secondary flex-shrink-0 relative z-10"
        >
          {/* Logo */}
          <div className={`flex items-center gap-3 p-4 border-b border-border-primary ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-white" />
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-sm font-semibold">Citadel</div>
                <div className="text-[10px] text-text-muted">Encrypted Vault</div>
              </motion.div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 p-2 overflow-auto">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                const btn = (
                  <button
                    key={item.id}
                    onClick={() => router.push(item.href)}
                    className={`relative flex items-center gap-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                      collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-lg bg-accent/10 border border-accent/20"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <item.icon size={18} className="relative z-10 flex-shrink-0" />
                    {!collapsed && (
                      <span className="relative z-10 text-[13px] font-medium">{item.label}</span>
                    )}
                  </button>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>{btn}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                }
                return btn;
              })}
            </div>
          </nav>

          {/* Collapse toggle */}
          <div className="p-2 border-t border-border-primary">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all text-xs cursor-pointer"
            >
              {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /> <span>Collapse</span></>}
            </button>
          </div>

          {/* Bottom actions */}
          <div className="p-2 border-t border-border-primary flex flex-col gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => lock()}
                  className={`flex items-center gap-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all cursor-pointer ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2'}`}
                >
                  <Lock size={15} />
                  {!collapsed && <span className="text-xs">Lock Vault</span>}
                </button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Lock Vault</TooltipContent>}
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  className={`flex items-center gap-2 rounded-lg text-danger/70 hover:text-danger hover:bg-danger/5 transition-all cursor-pointer ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2'}`}
                >
                  <LogOut size={15} />
                  {!collapsed && <span className="text-xs">Sign Out</span>}
                </button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
            </Tooltip>
          </div>

          {/* User */}
          <div className={`p-3 border-t border-border-primary flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/80 to-accent-cyan/80 flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {userEmail ? userEmail[0].toUpperCase() : 'U'}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-xs font-medium truncate">{userEmail || 'Loading...'}</div>
                <div className="text-[10px] text-text-muted">Free Plan</div>
              </div>
            )}
          </div>
        </motion.aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="h-14 border-b border-border-primary px-6 flex items-center justify-between bg-bg-secondary/50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-semibold capitalize">{activeSection}</h1>
              <Badge variant="default" className="text-[10px]">
                <Lock size={8} className="mr-0.5" /> Encrypted
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={showAgent ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowAgent(!showAgent)}
                className="text-xs"
              >
                <Sparkles size={13} />
                AI Agent
              </Button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-6 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Agent panel */}
        <AnimatePresence>
          {showAgent && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="border-l border-border-primary bg-bg-secondary overflow-hidden flex-shrink-0"
            >
              <AgentChat onClose={() => setShowAgent(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <VaultProvider>
      <DashboardContent>{children}</DashboardContent>
    </VaultProvider>
  );
}
