'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useVault } from '@/contexts/VaultContext';
import {
  Key, FileText, FolderOpen, TrendingUp,
  Plus, Clock, Shield, AlertTriangle, ArrowRight,
} from 'lucide-react';

interface Stats {
  passwords: number;
  notes: number;
  files: number;
}

interface Activity {
  id: string;
  action: string;
  item_type: string;
  item_title: string;
  created_at: string;
}

export default function DashboardPage() {
  const { isUnlocked } = useVault();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ passwords: 0, notes: 0, files: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    const supabase = createClient();

    const [passwords, notes, files, activityRes] = await Promise.all([
      supabase.from('vault_items').select('id', { count: 'exact' }).eq('type', 'login'),
      supabase.from('vault_items').select('id', { count: 'exact' }).eq('type', 'note'),
      supabase.from('vault_items').select('id', { count: 'exact' }).eq('type', 'file'),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    setStats({
      passwords: passwords.count || 0,
      notes: notes.count || 0,
      files: files.count || 0,
    });
    setActivities(activityRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!isUnlocked) return;
    loadDashboard();
  }, [isUnlocked]);

  const statCards = [
    { label: 'Passwords', value: stats.passwords, icon: Key, color: '#6366f1', href: '/dashboard/passwords' },
    { label: 'Secure Notes', value: stats.notes, icon: FileText, color: '#8b5cf6', href: '/dashboard/notes' },
    { label: 'Files', value: stats.files, icon: FolderOpen, color: '#06b6d4', href: '/dashboard/files' },
    { label: 'Vault Health', value: '100%', icon: Shield, color: '#22c55e', href: '/dashboard/passwords' },
  ];

  const quickActions = [
    { label: 'Add Password', icon: Key, onClick: () => router.push('/dashboard/passwords?action=add') },
    { label: 'New Note', icon: FileText, onClick: () => router.push('/dashboard/notes?action=add') },
    { label: 'Upload File', icon: FolderOpen, onClick: () => router.push('/dashboard/files?action=add') },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Welcome */}
      <div className="animate-fade-in" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 700 }}>Welcome back 👋</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
          Your vault is secure and encrypted. Here&apos;s an overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {statCards.map((card, i) => (
          <button
            key={card.label}
            onClick={() => router.push(card.href)}
            className="card-hover animate-fade-in"
            style={{
              animationDelay: `${i * 0.05}s`,
              padding: '24px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-xl)',
              textAlign: 'left',
              cursor: 'pointer',
              width: '100%',
              color: 'inherit',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {card.label}
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700 }}>
                  {loading ? <div className="skeleton" style={{ width: 60, height: 38 }} /> : card.value}
                </div>
              </div>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: `${card.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <card.icon size={20} style={{ color: card.color }} />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        {/* Recent Activity */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} style={{ color: 'var(--text-muted)' }} />
            Recent Activity
          </h3>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
          }}>
            {activities.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <Clock size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No activity yet</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                  Start by adding a password or note
                </p>
              </div>
            ) : (
              activities.map((a) => (
                <div key={a.id} style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border-primary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                }}>
                  <span>
                    <span style={{ color: 'var(--text-secondary)' }}>{a.action}</span>{' '}
                    <span style={{ fontWeight: 500 }}>{a.item_title}</span>
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} style={{ color: 'var(--text-muted)' }} />
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="card-hover"
                style={{
                  padding: '16px 18px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--accent-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <action.icon size={16} style={{ color: 'var(--accent-secondary)' }} />
                </div>
                {action.label}
                <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>

          {/* Security tip */}
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: 'rgba(99,102,241,0.05)',
            border: '1px solid rgba(99,102,241,0.1)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <Shield size={16} style={{ color: 'var(--accent-secondary)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Security Tip</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Use unique passwords for every account and enable 2FA wherever possible.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
