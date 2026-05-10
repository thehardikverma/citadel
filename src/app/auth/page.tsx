'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Check your email for a confirmation link!');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Signed in successfully');
        router.push('/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-bg-primary">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-12"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-accent/20">
            <Shield size={40} className="text-white" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-4">Citadel</h2>
          <p className="text-text-secondary text-lg leading-relaxed max-w-sm mx-auto">
            Your zero-knowledge encrypted fortress for everything private.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            {['AES-256', 'Zero-Knowledge', 'AI-Powered'].map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-bg-elevated border border-border-primary text-xs text-text-muted">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary mb-8 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold">Citadel</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? 'signup' : 'signin'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-2xl font-bold mb-1">
                {isSignUp ? 'Create your vault' : 'Welcome back'}
              </h1>
              <p className="text-sm text-text-muted mb-8">
                {isSignUp ? 'Start securing your digital life' : 'Enter your credentials to unlock'}
              </p>

              <form onSubmit={handleAuth} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9"
                      minLength={6}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="mt-2">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Button>
              </form>

              <p className="text-center text-sm text-text-muted mt-6">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-accent hover:text-accent-hover font-medium cursor-pointer"
                >
                  {isSignUp ? 'Sign In' : 'Create one'}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
