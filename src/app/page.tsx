'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Lock, FileText, Key, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Lock, label: 'AES-256-GCM Encryption', desc: 'Military-grade, zero-knowledge' },
  { icon: Key, label: 'Password Vault', desc: 'Auto-generate & store securely' },
  { icon: FileText, label: 'Secure Notes', desc: 'Encrypted end-to-end' },
  { icon: Sparkles, label: 'AI Agent', desc: 'Groq-powered vault assistant' },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-bg-primary">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.06)_0%,transparent_50%)]" />
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }} />

      {/* Animated orbs */}
      <motion.div
        className="absolute top-[15%] left-[10%] w-[300px] h-[300px] rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)', filter: 'blur(60px)' }}
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[15%] right-[10%] w-[250px] h-[250px] rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06), transparent 70%)', filter: 'blur(60px)' }}
        animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 max-w-2xl text-center">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3.5 mb-12"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center shadow-lg shadow-accent/20">
            <Shield size={28} className="text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold tracking-tight">Citadel</h1>
            <p className="text-xs text-text-muted tracking-wider uppercase">Private Vault</p>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight mb-5"
        >
          Your fortress for
          <br />
          <span className="gradient-text">everything private</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-md"
        >
          Zero-knowledge encrypted vault for passwords, notes, and files.
          AI-powered. Only you hold the key.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mt-10"
        >
          {features.map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-bg-secondary border border-border-primary text-sm text-text-secondary hover:border-accent/30 hover:text-text-primary transition-all duration-300 cursor-default"
            >
              <Icon size={14} className="text-accent" />
              {label}
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex gap-3 mt-12"
        >
          <Button size="lg" onClick={() => router.push('/auth')} className="group px-8">
            Get Started
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => router.push('/auth')}>
            Sign In
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-16 text-xs text-text-muted flex items-center gap-2"
        >
          <Zap size={12} className="text-accent" />
          End-to-end encrypted • Open source • Self-hosted on Vercel
        </motion.p>
      </div>
    </div>
  );
}
