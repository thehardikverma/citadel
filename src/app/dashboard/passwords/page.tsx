'use client';

import { useState, useEffect } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { createClient } from '@/lib/supabase/client';
import { encryptData, decryptData, getPasswordStrength, generatePassword } from '@/lib/crypto';
import { copyToClipboard } from '@/lib/utils';
import { 
  Key, Plus, Search, Copy, Check, Eye, EyeOff, 
  MoreVertical, Trash2, Edit2, Shield 
} from 'lucide-react';

export default function PasswordsPage() {
  const { masterPassword } = useVault();
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({ title: '', username: '', password: '', url: '' });
  const [showFormPassword, setShowFormPassword] = useState(false);

  const loadItems = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('vault_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'login')
      .order('created_at', { ascending: false });

    if (data) {
      // Decrypt items client-side
      const decryptedItems = await Promise.all(data.map(async (item) => {
        try {
          const decryptedJson = await decryptData(item.encrypted_data, item.iv, item.salt, masterPassword!);
          const credentials = JSON.parse(decryptedJson);
          return { ...item, credentials, showPassword: false };
        } catch (err) {
          console.error('Failed to decrypt item', item.id);
          return { ...item, error: true };
        }
      }));
      setItems(decryptedItems);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (masterPassword) loadItems();
  }, [masterPassword]);

  const handleCopyPassword = (id: string, password: string) => {
    copyToClipboard(password);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, showPassword: !item.showPassword } : item
    ));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword || !formData.title || !formData.password) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Encrypt the sensitive payload
    const payload = JSON.stringify({
      username: formData.username,
      password: formData.password
    });
    
    const { ciphertext, iv, salt } = await encryptData(payload, masterPassword);

    // Save to Supabase
    const { data, error } = await supabase.from('vault_items').insert({
      user_id: user.id,
      type: 'login',
      title: formData.title,
      encrypted_data: ciphertext,
      iv,
      salt,
      metadata: { url: formData.url }
    }).select().single();

    if (!error && data) {
      // Log activity
      await supabase.from('activity_log').insert({
        user_id: user.id,
        action: 'Added password',
        item_type: 'login',
        item_title: formData.title
      });

      // Update local state without full reload
      const newItem = { 
        ...data, 
        credentials: { username: formData.username, password: formData.password },
        showPassword: false 
      };
      setItems([newItem, ...items]);
      setShowAddModal(false);
      setFormData({ title: '', username: '', password: '', url: '' });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('vault_items').delete().eq('id', id);
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'Deleted password',
      item_type: 'login',
      item_title: title
    });

    setItems(items.filter(item => item.id !== id));
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) || 
    (item.metadata?.url || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Passwords</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Securely store and manage your login credentials.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          <Plus size={16} /> Add Password
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search passwords..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base"
            style={{ paddingLeft: '38px' }}
          />
        </div>
      </div>

      {/* Passwords List */}
      <div style={{ 
        background: 'var(--bg-secondary)', 
        border: '1px solid var(--border-primary)', 
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="skeleton" style={{ width: '100%', height: 60, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: '100%', height: 60, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: '100%', height: 60 }} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ 
              width: 64, height: 64, borderRadius: '16px', background: 'var(--bg-tertiary)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' 
            }}>
              <Key size={28} color="var(--text-muted)" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No passwords found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              {search ? 'Try a different search term.' : "You haven't saved any passwords yet."}
            </p>
            {!search && (
              <button onClick={() => setShowAddModal(true)} className="btn-primary">
                Add Your First Password
              </button>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Title</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Username</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Password</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="card-hover" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>
                        {item.title.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{item.title}</div>
                        {item.metadata?.url && (
                          <a href={item.metadata.url.startsWith('http') ? item.metadata.url : `https://${item.metadata.url}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--accent-secondary)', textDecoration: 'none' }}>
                            {item.metadata.url}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {item.error ? 'Error decrypting' : item.credentials?.username || '—'}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {item.error ? (
                      <span style={{ color: 'var(--danger)', fontSize: '13px' }}>Error</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontFamily: item.showPassword ? 'var(--font-sans)' : 'monospace', fontSize: item.showPassword ? '13px' : '18px', letterSpacing: item.showPassword ? 'normal' : '2px', color: item.showPassword ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {item.showPassword ? item.credentials?.password : '••••••••'}
                        </div>
                        <button onClick={() => togglePasswordVisibility(item.id)} className="btn-ghost" style={{ padding: '4px' }}>
                          {item.showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {!item.error && (
                        <button 
                          onClick={() => handleCopyPassword(item.id, item.credentials?.password)}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          {copiedId === item.id ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                          {copiedId === item.id ? 'Copied' : 'Copy'}
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(item.id, item.title)}
                        className="btn-ghost"
                        style={{ padding: '6px', color: 'var(--danger)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Password Modal */}
      {showAddModal && (
        <div className="overlay">
          <div className="animate-scale-in" style={{
            width: '100%', maxWidth: '460px', background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-xl)', padding: '28px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={20} style={{ color: 'var(--accent-primary)' }} /> Add Password
            </h3>
            
            <form onSubmit={handleAdd}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>Title / Service Name</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Netflix, Github" className="input-base" />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>Username / Email</label>
                <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="user@example.com" className="input-base" />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>Password</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input type={showFormPassword ? "text" : "password"} required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="input-base" style={{ paddingRight: '40px' }} />
                    <button type="button" onClick={() => setShowFormPassword(!showFormPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showFormPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button type="button" onClick={() => {
                    const pwd = generatePassword(16);
                    setFormData({...formData, password: pwd});
                    setShowFormPassword(true);
                  }} className="btn-secondary" title="Generate strong password">
                    Generate
                  </button>
                </div>
                {formData.password && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ height: '4px', flex: 1, background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${(getPasswordStrength(formData.password).score / 4) * 100}%`,
                        background: getPasswordStrength(formData.password).color,
                        transition: 'all 0.3s'
                      }} />
                    </div>
                    <span style={{ fontSize: '11px', color: getPasswordStrength(formData.password).color }}>
                      {getPasswordStrength(formData.password).label}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>URL (optional)</label>
                <input type="text" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://..." className="input-base" />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Save Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
