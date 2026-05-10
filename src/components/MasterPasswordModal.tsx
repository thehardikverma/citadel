'use client';

import { useState } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { createClient } from '@/lib/supabase/client';
import { hashMasterPassword, generateSalt } from '@/lib/crypto';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function MasterPasswordModal() {
  const { unlock } = useVault();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  // Check if user has a master password set
  useState(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_settings')
        .select('master_password_hash')
        .eq('user_id', user.id)
        .single();

      setIsFirstTime(!data?.master_password_hash);
    };
    check();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isFirstTime) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 8) {
          setError('Master password must be at least 8 characters');
          setLoading(false);
          return;
        }

        const salt = generateSalt();
        const saltBytes = new Uint8Array(
          atob(salt).split('').map((c) => c.charCodeAt(0))
        );
        const hash = await hashMasterPassword(password, saltBytes);

        await supabase.from('user_settings').upsert({
          user_id: user.id,
          master_password_hash: hash,
          salt,
        });

        unlock(password);
        toast.success('Master password created! Your vault is now secured.');
      } else {
        const { data: settings } = await supabase
          .from('user_settings')
          .select('master_password_hash, salt')
          .eq('user_id', user.id)
          .single();

        if (!settings) throw new Error('Settings not found');

        const saltBytes = new Uint8Array(
          atob(settings.salt).split('').map((c: string) => c.charCodeAt(0))
        );
        const hash = await hashMasterPassword(password, saltBytes);

        if (hash !== settings.master_password_hash) {
          setError('Incorrect master password');
          setLoading(false);
          return;
        }

        unlock(password);
        toast.success('Vault unlocked');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }

    setLoading(false);
  };

  if (isFirstTime === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg-primary z-50">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg-primary z-50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.04)_0%,transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-sm mx-6"
      >
        <div className="rounded-2xl border border-border-secondary bg-bg-card p-8 shadow-2xl shadow-black/50">
          {/* Lock icon */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/20"
          >
            <Lock size={28} className="text-white" />
          </motion.div>

          <h2 className="text-xl font-bold text-center mb-1">
            {isFirstTime ? 'Create Master Password' : 'Unlock Vault'}
          </h2>
          <p className="text-sm text-text-muted text-center mb-6">
            {isFirstTime
              ? 'This password encrypts all your vault data. It cannot be recovered.'
              : 'Enter your master password to access your vault.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Master password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {isFirstTime && (
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm master password"
                required
              />
            )}

            {error && (
              <p className="text-xs text-danger bg-danger/5 border border-danger/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="mt-1">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {isFirstTime ? 'Create & Unlock' : 'Unlock'}
            </Button>
          </form>

          {isFirstTime && (
            <p className="text-[11px] text-text-muted text-center mt-4 flex items-center justify-center gap-1.5">
              <Shield size={10} />
              Zero-knowledge — we never see your password
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
