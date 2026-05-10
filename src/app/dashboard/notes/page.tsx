'use client';

import { useState, useEffect } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { createClient } from '@/lib/supabase/client';
import { encryptData, decryptData } from '@/lib/crypto';
import { motion } from 'framer-motion';
import { FileText, Plus, Search, Trash2, Edit3, X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function NotesPage() {
  const { masterPassword } = useVault();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeNote, setActiveNote] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const loadNotes = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('vault_items').select('*')
      .eq('user_id', user.id).eq('type', 'note')
      .order('updated_at', { ascending: false });

    if (data) {
      const dec = await Promise.all(data.map(async (item) => {
        try {
          const content = await decryptData(item.encrypted_data, item.iv, item.salt, masterPassword!);
          return { ...item, content };
        } catch {
          return { ...item, error: true, content: 'Error decrypting note.' };
        }
      }));
      setNotes(dec);
    }
    setLoading(false);
  };

  useEffect(() => { if (masterPassword) loadNotes(); }, [masterPassword]);

  const handleSave = async () => {
    if (!masterPassword || !editTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { ciphertext, iv, salt } = await encryptData(editContent || ' ', masterPassword);

      if (activeNote?.id) {
        const { error } = await supabase.from('vault_items').update({
          title: editTitle, encrypted_data: ciphertext, iv, salt,
          updated_at: new Date().toISOString()
        }).eq('id', activeNote.id);
        if (error) throw error;
        setNotes(notes.map(n => n.id === activeNote.id ? { ...n, title: editTitle, content: editContent, updated_at: new Date().toISOString() } : n));
        toast.success('Note updated');
      } else {
        const { data, error } = await supabase.from('vault_items').insert({
          user_id: user.id, type: 'note', title: editTitle,
          encrypted_data: ciphertext, iv, salt,
        }).select().single();
        if (error) throw error;
        if (data) {
          await supabase.from('activity_log').insert({ user_id: user.id, action: 'Created note', item_type: 'note', item_title: editTitle });
          setNotes([{ ...data, content: editContent }, ...notes]);
          setActiveNote({ ...data, content: editContent });
          toast.success('Note created');
        }
      }
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save note');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    const supabase = createClient();
    await supabase.from('vault_items').delete().eq('id', id);
    setNotes(notes.filter(n => n.id !== id));
    if (activeNote?.id === id) { setIsEditing(false); setActiveNote(null); }
    toast.success('Note deleted');
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (!n.error && n.content.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex h-[calc(100vh-108px)] gap-5">
      {/* Sidebar */}
      <div className="w-72 flex flex-col gap-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Notes</h2>
          <Button size="sm" onClick={() => { setActiveNote(null); setEditTitle(''); setEditContent(''); setIsEditing(true); }}>
            <Plus size={13} /> New
          </Button>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)
          ) : filteredNotes.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-8">No notes found</p>
          ) : (
            filteredNotes.map((note) => (
              <motion.button
                key={note.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => { setActiveNote(note); setIsEditing(false); setEditTitle(note.title); setEditContent(note.content); }}
                className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                  activeNote?.id === note.id
                    ? 'border-accent/30 bg-accent/5'
                    : 'border-border-primary bg-bg-card hover:bg-bg-hover hover:border-border-secondary'
                }`}
              >
                <p className="text-sm font-medium truncate">{note.title}</p>
                <p className="text-[11px] text-text-muted truncate mt-0.5">{note.error ? 'Encrypted' : note.content}</p>
                <p className="text-[9px] text-text-muted mt-1">{new Date(note.updated_at).toLocaleDateString()}</p>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 rounded-xl border border-border-primary bg-bg-card flex flex-col overflow-hidden">
        {!activeNote && !isEditing ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
            <FileText size={40} className="opacity-20 mb-3" />
            <p className="text-sm">Select or create a note</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-border-primary flex items-center justify-between">
              {isEditing ? (
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Note Title"
                  className="bg-transparent border-none outline-none text-lg font-semibold w-[60%] text-text-primary placeholder:text-text-muted" />
              ) : (
                <h2 className="text-lg font-semibold truncate">{activeNote?.title}</h2>
              )}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="ghost" size="icon-sm" onClick={() => { setIsEditing(false); if (!activeNote) setActiveNote(null); }}><X size={14} /></Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}><Edit3 size={13} /> Edit</Button>
                    <Button variant="ghost" size="icon-sm" className="text-danger/70 hover:text-danger" onClick={() => handleDelete(activeNote.id)}><Trash2 size={14} /></Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 p-5 overflow-auto">
              {isEditing ? (
                <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="Write your note here..."
                  className="w-full h-full min-h-[300px] text-[15px] leading-relaxed border-none bg-transparent focus:ring-0 resize-none" />
              ) : (
                <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{activeNote?.content}</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
