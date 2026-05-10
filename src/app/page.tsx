'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, FileText, Key, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, rgba(99,102,241,0.08) 0%, var(--bg-primary) 60%)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* Floating orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '15%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(192,132,252,0.05) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div className="animate-fade-in" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '48px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 40px rgba(99,102,241,0.3)',
        }}>
          <Shield size={28} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em' }}>Citadel</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Private Vault</p>
        </div>
      </div>

      {/* Tagline */}
      <div className="animate-fade-in" style={{ animationDelay: '0.1s', textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: '520px' }}>
        <h2 style={{
          fontSize: '42px',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: '16px',
        }}>
          Your fortress for
          <br />
          <span className="gradient-text">everything private</span>
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Zero-knowledge encrypted vault for passwords, notes, and files.
          Access anywhere. AI-powered. Only you hold the key.
        </p>
      </div>

      {/* Feature pills */}
      <div className="animate-fade-in" style={{
        animationDelay: '0.2s',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        justifyContent: 'center',
        marginTop: '32px',
        position: 'relative',
        zIndex: 1,
      }}>
        {[
          { icon: Lock, label: 'AES-256 Encrypted' },
          { icon: Key, label: 'Password Vault' },
          { icon: FileText, label: 'Secure Notes' },
          { icon: Sparkles, label: 'AI Agent' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}>
            <Icon size={14} style={{ color: 'var(--accent-secondary)' }} />
            {label}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="animate-fade-in" style={{
        animationDelay: '0.3s',
        display: 'flex',
        gap: '12px',
        marginTop: '40px',
        position: 'relative',
        zIndex: 1,
      }}>
        <button
          onClick={() => router.push('/auth')}
          className="btn-primary"
          style={{
            padding: '14px 32px',
            fontSize: '15px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 0 30px rgba(99,102,241,0.25)',
          }}
        >
          Get Started
        </button>
        <button
          onClick={() => router.push('/auth')}
          className="btn-secondary"
          style={{
            padding: '14px 32px',
            fontSize: '15px',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          Sign In
        </button>
      </div>

      {/* Footer */}
      <p className="animate-fade-in" style={{
        animationDelay: '0.4s',
        marginTop: '64px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        position: 'relative',
        zIndex: 1,
      }}>
        End-to-end encrypted • Open source • Self-hosted on Vercel
      </p>
    </div>
  );
}
