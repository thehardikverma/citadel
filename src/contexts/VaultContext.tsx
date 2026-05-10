'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

interface VaultContextType {
  isUnlocked: boolean;
  masterPassword: string | null;
  unlock: (password: string) => void;
  lock: () => void;
  autoLockMinutes: number;
  setAutoLockMinutes: (min: number) => void;
}

const VaultContext = createContext<VaultContextType>({
  isUnlocked: false,
  masterPassword: null,
  unlock: () => {},
  lock: () => {},
  autoLockMinutes: 15,
  setAutoLockMinutes: () => {},
});

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [autoLockMinutes, setAutoLockMinutes] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const lock = useCallback(() => {
    setIsUnlocked(false);
    setMasterPassword(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const unlock = useCallback((password: string) => {
    setMasterPassword(password);
    setIsUnlocked(true);
  }, []);

  // Auto-lock on inactivity
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isUnlocked && autoLockMinutes > 0) {
      timerRef.current = setTimeout(() => {
        lock();
      }, autoLockMinutes * 60 * 1000);
    }
  }, [isUnlocked, autoLockMinutes, lock]);

  useEffect(() => {
    if (!isUnlocked) return;

    resetTimer();
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetTimer));

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isUnlocked, resetTimer]);

  return (
    <VaultContext.Provider
      value={{ isUnlocked, masterPassword, unlock, lock, autoLockMinutes, setAutoLockMinutes }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
