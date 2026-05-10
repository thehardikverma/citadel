'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { useVault } from '@/contexts/VaultContext';
import { useRouter } from 'next/navigation';
import { Sparkles, X, Send, Bot, User, Loader2 } from 'lucide-react';

export default function AgentChat({ onClose }: { onClose: () => void }) {
  const { masterPassword } = useVault();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/agent',
    body: {
      currentSection: window.location.pathname.split('/').pop() || 'dashboard',
      masterPassword, // Send password to server for encryption tools
    },
    onToolCall: ({ toolCall }) => {
      // Handle UI-specific tool calls on the client
      if (toolCall.toolName === 'navigateTo') {
        const { section } = toolCall.args as { section: string };
        if (section === 'dashboard') router.push('/dashboard');
        else router.push(`/dashboard/${section}`);
      }
    }
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="animate-slide-in-up" style={{
      position: 'absolute',
      bottom: '80px',
      right: '24px',
      width: '380px',
      height: '560px',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-secondary)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 50,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent-primary), #c084fc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={14} color="white" />
          </div>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>Citadel AI</div>
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginTop: 'auto', marginBottom: 'auto' }}>
            <Sparkles size={24} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p>I am your vault assistant.</p>
            <p style={{ marginTop: '4px' }}>I can generate passwords, save notes, and navigate your dashboard.</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} style={{ display: 'flex', gap: '12px', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
              background: m.role === 'user' ? 'var(--bg-tertiary)' : 'rgba(99,102,241,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {m.role === 'user' ? <User size={14} /> : <Bot size={14} style={{ color: 'var(--accent-secondary)' }} />}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '80%' }}>
              {m.content && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '16px',
                  borderTopRightRadius: m.role === 'user' ? '4px' : '16px',
                  borderTopLeftRadius: m.role === 'user' ? '16px' : '4px',
                  background: m.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.content.replace(/ACTION_NAVIGATE:[a-z]+/g, 'Navigating...')}
                </div>
              )}
              
              {/* Render Tool Calls (Action blocks) */}
              {m.toolInvocations?.map(tool => (
                <div key={tool.toolCallId} style={{
                  padding: '10px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {tool.state === 'result' ? (
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
                  ) : (
                    <Loader2 size={12} className="animate-spin" />
                  )}
                  {tool.toolName === 'addPassword' && 'Adding password to vault...'}
                  {tool.toolName === 'createNote' && 'Creating secure note...'}
                  {tool.toolName === 'searchVaultMetadata' && 'Searching vault...'}
                  {tool.toolName === 'generateStrongPassword' && 'Generating password...'}
                  {tool.toolName === 'navigateTo' && 'Navigating UI...'}
                  {tool.toolName === 'getDashboardStats' && 'Reading vault stats...'}
                </div>
              ))}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={14} style={{ color: 'var(--accent-secondary)' }} />
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '16px', borderTopLeftRadius: '4px', background: 'var(--bg-tertiary)' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1.5s infinite 0.2s' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1.5s infinite 0.4s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
        <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me to save a password..."
            disabled={isLoading}
            className="input-base"
            style={{ paddingRight: '44px', borderRadius: 'var(--radius-lg)' }}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            style={{
              position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
              width: '32px', height: '32px', borderRadius: '10px',
              background: input.trim() ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: input.trim() ? 'white' : 'var(--text-muted)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            <Send size={14} />
          </button>
        </form>
      </div>
      
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
