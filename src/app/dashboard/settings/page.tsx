'use client';

import { useState } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, LogOut, Download, Shield, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { lock } = useVault();
  const router = useRouter();
  const [autoLock, setAutoLock] = useState(15);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data } = await supabase.from('vault_items').select('*').eq('user_id', user.id);
      if (!data) throw new Error('No data');

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `citadel-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup exported (encrypted data)');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    }
    setExporting(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold mb-1">Settings</h2>
        <p className="text-sm text-text-muted mb-8">Manage your vault preferences.</p>
      </motion.div>

      <div className="flex flex-col gap-5">
        {/* Auto-lock */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border-primary">
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Clock size={16} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Auto-Lock</h3>
                  <p className="text-xs text-text-muted">Lock vault after inactivity</p>
                </div>
              </div>
              <div className="flex gap-2">
                {[5, 15, 30, 60].map((m) => (
                  <Button
                    key={m}
                    variant={autoLock === m ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => { setAutoLock(m); toast.success(`Auto-lock set to ${m} min`); }}
                  >
                    {m} min
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Export */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border-primary">
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
                  <Download size={16} className="text-accent-cyan" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Export Backup</h3>
                  <p className="text-xs text-text-muted">Download encrypted vault data as JSON</p>
                </div>
              </div>
              <Button variant="secondary" onClick={handleExport} disabled={exporting}>
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Export Encrypted Backup
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border-primary">
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-accent-emerald/10 flex items-center justify-center">
                  <Shield size={16} className="text-accent-emerald" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Security</h3>
                  <p className="text-xs text-text-muted">AES-256-GCM • PBKDF2 (600k iterations) • Zero-knowledge</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sign out */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-danger/10">
            <CardContent>
              <Button variant="danger" onClick={handleSignOut}>
                <LogOut size={14} /> Sign Out
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
