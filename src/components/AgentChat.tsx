'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User, Loader2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolResults?: { toolName: string; result: string }[];
}

export default function AgentChat({ onClose }: { onClose: () => void }) {
  const { masterPassword } = useVault();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setIsLoading(true);

    try {
      const section = window.location.pathname.split('/').pop() || 'dashboard';
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          currentSection: section,
          masterPassword,
        }),
      });

      const data = await res.json();

      // Handle navigation
      const navMatch = data.content?.match(/ACTION_NAVIGATE:(\w+)/);
      if (navMatch) {
        const s = navMatch[1];
        router.push(s === 'dashboard' ? '/dashboard' : `/dashboard/${s}`);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: (data.content || 'Done.').replace(/ACTION_NAVIGATE:\w+/g, 'Navigating...'),
        toolResults: data.toolResults,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center">
            <Sparkles size={13} className="text-white" />
          </div>
          <span className="text-sm font-semibold">Citadel AI</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}><X size={14} /></Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-center px-4">
            <Sparkles size={20} className="opacity-30 mb-3" />
            <p className="text-xs">I&apos;m your vault assistant.</p>
            <p className="text-[11px] mt-1 opacity-70">Try: &quot;Generate a strong password&quot; or &quot;Save a note&quot;</p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center ${
                m.role === 'user' ? 'bg-bg-elevated' : 'bg-accent/10'
              }`}>
                {m.role === 'user' ? <User size={12} /> : <Bot size={12} className="text-accent" />}
              </div>
              <div className="flex flex-col gap-2 max-w-[80%]">
                {m.content && (
                  <div className={`px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-accent text-white rounded-tr-sm'
                      : 'bg-bg-elevated text-text-primary rounded-tl-sm'
                  }`}>
                    {m.content}
                  </div>
                )}
                {m.toolResults?.map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-secondary border border-border-primary rounded-md text-[10px] text-text-muted">
                    <Wrench size={10} className="text-accent" />
                    {t.toolName}: {typeof t.result === 'string' ? t.result.slice(0, 60) : 'Done'}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center">
              <Bot size={12} className="text-accent" />
            </div>
            <div className="px-3 py-2 rounded-xl rounded-tl-sm bg-bg-elevated">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-muted" style={{ animation: `typing-dot 1.5s infinite ${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border-primary">
        <form onSubmit={handleSubmit} className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={isLoading}
            className="pr-10 h-9 text-xs"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer ${
              input.trim() ? 'bg-accent text-white' : 'bg-bg-elevated text-text-muted'
            }`}
          >
            <Send size={11} />
          </button>
        </form>
      </div>
    </div>
  );
}
