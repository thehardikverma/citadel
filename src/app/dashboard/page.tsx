'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useVault } from '@/contexts/VaultContext';
import { motion } from 'framer-motion';
import { Key, FileText, FolderOpen, Plus, Shield, Activity, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  passwords: number;
  notes: number;
  files: number;
}

interface ActivityItem {
  id: string;
  action: string;
  item_title: string;
  item_type: string;
  created_at: string;
}

export default function DashboardPage() {
  const { masterPassword } = useVault();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [passwords, notes, files, activityData] = await Promise.all([
        supabase.from('vault_items').select('id', { count: 'exact' }).eq('user_id', user.id).eq('type', 'login'),
        supabase.from('vault_items').select('id', { count: 'exact' }).eq('user_id', user.id).eq('type', 'note'),
        supabase.from('vault_items').select('id', { count: 'exact' }).eq('user_id', user.id).eq('type', 'file'),
        supabase.from('activity_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        passwords: passwords.count || 0,
        notes: notes.count || 0,
        files: files.count || 0,
      });
      setActivity((activityData.data || []) as ActivityItem[]);
      setLoading(false);
    };
    if (masterPassword) load();
  }, [masterPassword]);

  const statCards = [
    { label: 'Passwords', value: stats?.passwords || 0, icon: Key, color: 'from-violet-500/20 to-violet-500/5', iconColor: 'text-violet-400', href: '/dashboard/passwords' },
    { label: 'Secure Notes', value: stats?.notes || 0, icon: FileText, color: 'from-cyan-500/20 to-cyan-500/5', iconColor: 'text-cyan-400', href: '/dashboard/notes' },
    { label: 'Files', value: stats?.files || 0, icon: FolderOpen, color: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-400', href: '/dashboard/files' },
  ];

  const quickActions = [
    { label: 'Add Password', icon: Key, href: '/dashboard/passwords' },
    { label: 'New Note', icon: FileText, href: '/dashboard/notes' },
    { label: 'Upload File', icon: FolderOpen, href: '/dashboard/files' },
  ];

  return (
    <div className="max-w-5xl">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
        <p className="text-sm text-text-secondary">Your vault is secured and encrypted. Here&apos;s an overview.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card
                className={`bg-gradient-to-br ${stat.color} border-border-primary hover:border-border-secondary transition-all cursor-pointer group`}
                onClick={() => router.push(stat.href)}
              >
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-muted mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-bg-primary/50 flex items-center justify-center ${stat.iconColor} group-hover:scale-110 transition-transform`}>
                    <stat.icon size={22} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-border-primary">
            <CardContent>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Plus size={14} className="text-accent" /> Quick Actions
              </h3>
              <div className="flex flex-col gap-2">
                {quickActions.map(({ label, icon: Icon, href }) => (
                  <Button
                    key={label}
                    variant="ghost"
                    className="justify-between h-auto py-3 px-3 group"
                    onClick={() => router.push(href)}
                  >
                    <span className="flex items-center gap-2.5 text-sm">
                      <Icon size={15} className="text-text-muted" />
                      {label}
                    </span>
                    <ArrowRight size={13} className="text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="border-border-primary">
            <CardContent>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Activity size={14} className="text-accent" /> Recent Activity
              </h3>
              {loading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-lg" />
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <p className="text-sm text-text-muted py-8 text-center">No activity yet. Start adding items to your vault!</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {activity.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.05 }}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-bg-hover transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center">
                          {item.item_type === 'login' ? <Key size={13} className="text-violet-400" /> :
                           item.item_type === 'note' ? <FileText size={13} className="text-cyan-400" /> :
                           <FolderOpen size={13} className="text-emerald-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.action}</p>
                          <p className="text-xs text-text-muted">{item.item_title}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-text-muted">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Security tip */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <Card className="border-accent/10 bg-accent/[0.03]">
          <CardContent className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium">Security Tip</p>
              <p className="text-xs text-text-muted">Use a unique, strong master password and never share it. Citadel uses zero-knowledge encryption — even we can&apos;t see your data.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
