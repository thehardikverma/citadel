'use client';

import { useState } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { createClient } from '@/lib/supabase/client';
import { hashMasterPassword, generateSalt } from '@/lib/crypto';
import { Shield, Lock, Eye, EyeOff, ArrowRight, AlertTriangle } from 'lucide-react';

export default function MasterPasswordModal() {
  const { unlock } = useVault();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);

  const checkIfFirstTime = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_settings')
      .select('master_password_hash')
      .eq('user_id', user.id)
      .single();

    setIsFirstTime(!data?.master_password_hash);
    setChecked(true);
  };

  // Check on mount
  if (!checked) {
    checkIfFirstTime();
  }

  const handleSetup = async () => {
    if (password.length < 8) {
      setError('Master password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const salt = generateSalt();
      const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
      const hash = await hashMasterPassword(password, saltBytes);

      await supabase.from('user_settings').upsert({
        user_id: user.id,
        master_password_hash: hash,
        salt,
      });

      unlock(password);
    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }

    setLoading(false);
  };

  const handleUnlock = async () => {
    if (!password) return;

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: settings } = await supabase
        .from('user_settings')
        .select('master_password_hash, salt')
        .eq('user_id', user.id)
        .single();

      if (!settings) throw new Error('No settings found');

      const saltBytes = Uint8Array.from(atob(settings.salt), c => c.charCodeAt(0));
      const hash = await hashMasterPassword(password, saltBytes);

      if (hash !== settings.master_password_hash) {
        setError('Incorrect master password');
        setLoading(false);
        return;
      }

      unlock(password);
    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }

    setLoading(false);
  };

  if (!checked) {
    return (
      <div className="overlay">
        <div style={{ textAlign: 'center' }}>
          <div className="skeleton" style={{ width: 200, height: 20, margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="overlay">
      <div className="animate-scale-in" style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 0 40px rgba(99,102,241,0.3)',
          }}>
            {isFirstTime ? <Shield size={30} color="white" /> : <Lock size={28} color="white" />}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
            {isFirstTime ? 'Set Your Master Password' : 'Unlock Vault'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {isFirstTime
              ? 'This password encrypts all your data. It cannot be recovered if lost.'
              : 'Enter your master password to decrypt your vault'}
          </p>
        </div>

        {/* Warning for first time */}
        {isFirstTime && (
          <div style={{
            display: 'flex',
            gap: '10px',
            padding: '12px',
            borderRadius: 'var(--radius)',
            background: 'rgba(234,179,8,0.08)',
            border: '1px solid rgba(234,179,8,0.15)',
            marginBottom: '20px',
            fontSize: '12px',
            color: 'var(--warning)',
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>If you forget this password, your data <strong>cannot</strong> be recovered. Write it down somewhere safe.</span>
          </div>
        )}

        {/* Password input */}
        <div style={{ marginBottom: isFirstTime ? '12px' : '20px' }}>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Master password"
              autoFocus
              className="input-base"
              style={{ paddingLeft: '38px', paddingRight: '42px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isFirstTime) handleUnlock();
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px',
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm password (first time only) */}
        {isFirstTime && (
          <div style={{ marginBottom: '20px' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm master password"
              className="input-base"
              style={{ paddingLeft: '14px' }}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 'var(--radius)', marginBottom: '16px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: 'var(--danger)', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={isFirstTime ? handleSetup : handleUnlock}
          disabled={loading || !password}
          className="btn-primary"
          style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius)' }}
        >
          {loading ? 'Processing...' : (
            <>
              {isFirstTime ? 'Set Master Password' : 'Unlock'}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
