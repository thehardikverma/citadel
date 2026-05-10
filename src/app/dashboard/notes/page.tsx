'use client';

import { useState, useEffect } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { createClient } from '@/lib/supabase/client';
import { encryptData, decryptData } from '@/lib/crypto';
import { FileText, Plus, Search, Trash2, Edit3, X, Save } from 'lucide-react';

export default function NotesPage() {
  const { masterPassword } = useVault();
  const [notes, setNotes] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Editor state
  const [activeNote, setActiveNote] = useState<Record<string, unknown> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const loadNotes = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('vault_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'note')
      .order('updated_at', { ascending: false });

    if (data) {
      const decryptedNotes = await Promise.all(data.map(async (item) => {
        try {
          const content = await decryptData(item.encrypted_data, item.iv, item.salt, masterPassword!);
          return { ...item, content };
        } catch (err) {
          console.error('Failed to decrypt note', item.id);
          return { ...item, error: true, content: 'Error decrypting note.' };
        }
      }));
      setNotes(decryptedNotes);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (masterPassword) loadNotes();
  }, [masterPassword]);

  const handleSave = async () => {
    if (!masterPassword || !editTitle || !editContent) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { ciphertext, iv, salt } = await encryptData(editContent, masterPassword);

    if (activeNote?.id) {
      // Update
      const { error } = await supabase.from('vault_items').update({
        title: editTitle,
        encrypted_data: ciphertext,
        iv,
        salt,
        updated_at: new Date().toISOString()
      }).eq('id', activeNote.id);

      if (!error) {
        setNotes(notes.map(n => n.id === activeNote.id ? { ...n, title: editTitle, content: editContent, updated_at: new Date().toISOString() } : n));
      }
    } else {
      // Insert
      const { data, error } = await supabase.from('vault_items').insert({
        user_id: user.id,
        type: 'note',
        title: editTitle,
        encrypted_data: ciphertext,
        iv,
        salt,
      }).select().single();

      if (!error && data) {
        setNotes([{ ...data, content: editContent }, ...notes]);
      }
    }

    setIsEditing(false);
    setActiveNote(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this secure note?')) return;
    
    const supabase = createClient();
    await supabase.from('vault_items').delete().eq('id', id);
    setNotes(notes.filter(n => n.id !== id));
    if (activeNote?.id === id) {
      setIsEditing(false);
      setActiveNote(null);
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    (!n.error && n.content.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 108px)', gap: '24px' }}>
      
      {/* Sidebar List */}
      <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Secure Notes</h2>
          <button 
            onClick={() => { setActiveNote(null); setEditTitle(''); setEditContent(''); setIsEditing(true); }}
            className="btn-primary" style={{ padding: '6px 12px' }}
          >
            <Plus size={14} /> New
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search notes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base"
            style={{ paddingLeft: '34px', fontSize: '13px' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius)' }} />
          ) : filteredNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              No notes found
            </div>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => { setActiveNote(note); setIsEditing(false); setEditTitle(note.title); setEditContent(note.content); }}
                style={{
                  padding: '16px',
                  background: activeNote?.id === note.id ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                  border: `1px solid ${activeNote?.id === note.id ? 'rgba(99,102,241,0.3)' : 'var(--border-primary)'}`,
                  borderRadius: 'var(--radius)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '14px', color: activeNote?.id === note.id ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>
                  {note.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {note.error ? 'Encrypted content' : note.content}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {new Date(note.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div style={{ 
        flex: 1, 
        background: 'var(--bg-secondary)', 
        border: '1px solid var(--border-primary)', 
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {!activeNote && !isEditing ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>Select a note to view or create a new one.</p>
          </div>
        ) : (
          <>
            {/* Editor Toolbar */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {isEditing ? (
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Note Title"
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', width: '60%' }}
                />
              ) : (
                <h2 style={{ fontSize: '20px', fontWeight: 600 }}>{activeNote.title}</h2>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                {isEditing ? (
                  <>
                    <button onClick={() => { setIsEditing(false); if (!activeNote) setActiveNote(null); }} className="btn-ghost" style={{ padding: '8px' }}><X size={16} /></button>
                    <button onClick={handleSave} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}><Save size={14} /> Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(true)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}><Edit3 size={14} /> Edit</button>
                    <button onClick={() => handleDelete(activeNote.id)} className="btn-ghost" style={{ padding: '8px', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                  </>
                )}
              </div>
            </div>

            {/* Editor Content */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
              {isEditing ? (
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Write your secure note here. Supports Markdown..."
                  style={{ 
                    width: '100%', height: '100%', resize: 'none', background: 'transparent', 
                    border: 'none', outline: 'none', color: 'var(--text-primary)', 
                    fontSize: '15px', lineHeight: 1.6, fontFamily: 'var(--font-sans)'
                  }}
                />
              ) : (
                <div style={{ fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {activeNote.content}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
