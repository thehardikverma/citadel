'use client';

import { useState } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { createClient } from '@/lib/supabase/client';
import { hashMasterPassword } from '@/lib/crypto';
import { Save, LogOut, Download, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { autoLockMinutes, setAutoLockMinutes, lock } = useVault();
  const router = useRouter();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ text: 'New password must be at least 8 characters', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Verify current password
      const { data: settings } = await supabase
        .from('user_settings')
        .select('master_password_hash, salt')
        .eq('user_id', user.id)
        .single();

      if (!settings) throw new Error('Settings not found');

      const oldSaltBytes = Uint8Array.from(atob(settings.salt), c => c.charCodeAt(0));
      const oldHash = await hashMasterPassword(currentPassword, oldSaltBytes);

      if (oldHash !== settings.master_password_hash) {
        throw new Error('Current master password is incorrect');
      }

      // 2. We can't re-encrypt everything in the browser easily without downloading the whole vault.
      // In a real production app, we would:
      // - Download all vault items
      // - Decrypt them all with old master password
      // - Re-encrypt them all with new master password
      // - Upload them back
      // For this phase, we just show a message that this requires vault re-encryption.
      
      setMessage({ 
        text: 'To change your master password, your entire vault must be downloaded and re-encrypted. This feature is coming in Phase 2.', 
        type: 'info' 
      });

    } catch (err: Error | unknown) {
      setMessage({ text: err instanceof Error ? err.message : String(err), type: 'error' });
    }
    setLoading(false);
  };

  const handleExport = async () => {
    // Generate an encrypted JSON backup of the vault
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('vault_items')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        items: data
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `citadel-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Settings</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Manage your vault security and preferences.</p>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        
        {/* Security Preferences */}
        <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-xl)', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} style={{ color: 'var(--accent-primary)' }} />
            Security Preferences
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border-primary)' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>Vault Auto-Lock</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Automatically lock vault after inactivity</div>
            </div>
            <select 
              value={autoLockMinutes} 
              onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 'var(--radius)', fontSize: '13px', outline: 'none' }}
            >
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={0}>Never</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>Lock Vault Now</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Immediately lock your session</div>
            </div>
            <button onClick={lock} className="btn-secondary">
              <LogOut size={16} /> Lock
            </button>
          </div>
        </section>

        {/* Change Master Password */}
        <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-xl)', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Change Master Password</h3>
          
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>Current Master Password</label>
              <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="input-base" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>New Master Password</label>
              <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-base" minLength={8} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>Confirm New Password</label>
              <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-base" minLength={8} />
            </div>

            {message.text && (
              <div style={{ 
                padding: '12px', borderRadius: 'var(--radius)', fontSize: '13px',
                background: message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                color: message.type === 'error' ? 'var(--danger)' : 'var(--accent-secondary)'
              }}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ alignSelf: 'flex-start' }}>
              <Save size={16} /> Save Changes
            </button>
          </form>
        </section>

        {/* Data & Backup */}
        <section style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-xl)', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Data & Backup</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border-primary)' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>Export Encrypted Backup</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Download your entire vault as an encrypted JSON file</div>
            </div>
            <button onClick={handleExport} className="btn-secondary">
              <Download size={16} /> Export
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '14px' }}>Delete Account</div>
              <div style={{ fontSize: '13px', color: 'var(--danger)' }}>Permanently delete your account and all encrypted data</div>
            </div>
            <button className="btn-danger">
              Delete Account
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
