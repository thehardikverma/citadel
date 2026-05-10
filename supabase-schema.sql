-- ============================================
-- CITADEL — Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================

-- Vault items (passwords, notes, cards, files)
CREATE TABLE IF NOT EXISTS vault_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('login', 'note', 'card', 'file', 'identity')),
  title TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  folder TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;

-- Users can only access their own items
CREATE POLICY "Users can select own items" ON vault_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items" ON vault_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items" ON vault_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items" ON vault_items
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_vault_items_user_type ON vault_items(user_id, type);
CREATE INDEX idx_vault_items_user_folder ON vault_items(user_id, folder);

-- ============================================
-- Activity log
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  item_type TEXT,
  item_title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own activity" ON activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users log own activity" ON activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- User settings (master password hash, preferences)
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  master_password_hash TEXT,
  salt TEXT,
  auto_lock_minutes INT DEFAULT 15,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Enable Realtime for vault_items (cross-device sync)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE vault_items;
