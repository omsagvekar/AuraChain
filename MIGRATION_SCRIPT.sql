-- ============================================
-- MIGRATION SCRIPT - Update Existing Schema
-- ============================================
-- This script updates your existing schema to work with the Aura Points system
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Add UNIQUE constraint to likes table
-- ============================================
-- Prevents duplicate likes from same user on same post
ALTER TABLE public.likes 
ADD CONSTRAINT likes_post_user_unique UNIQUE (post_id, user_id);

-- ============================================
-- 2. Add UNIQUE constraint to shares table
-- ============================================
-- Prevents duplicate shares from same user on same post
ALTER TABLE public.shares 
ADD CONSTRAINT shares_post_user_unique UNIQUE (post_id, user_id);

-- ============================================
-- 3. Add missing indexes for performance
-- ============================================

-- Likes indexes
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON public.likes(created_at);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- Shares indexes
CREATE INDEX IF NOT EXISTS idx_shares_post_id ON public.shares(post_id);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON public.shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_created_at ON public.shares(created_at);

-- Points ledger indexes (for tracking)
CREATE INDEX IF NOT EXISTS idx_points_ledger_user_id ON public.points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_created_at ON public.points_ledger(created_at DESC);

-- ============================================
-- 4. Add updated_at column to comments (if needed)
-- ============================================
-- Check if column exists, add if not
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.comments ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
END $$;

-- ============================================
-- 5. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. Create RLS Policies for likes
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;

-- Create new policies
CREATE POLICY "Anyone can view likes"
  ON public.likes FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own likes"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 7. Create RLS Policies for comments
-- ============================================
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Users can create their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Anyone can view comments"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 8. Create RLS Policies for shares
-- ============================================
DROP POLICY IF EXISTS "Anyone can view shares" ON public.shares;
DROP POLICY IF EXISTS "Users can create their own shares" ON public.shares;
DROP POLICY IF EXISTS "Users can delete their own shares" ON public.shares;

CREATE POLICY "Anyone can view shares"
  ON public.shares FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own shares"
  ON public.shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shares"
  ON public.shares FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 9. Create database function for atomic aura updates
-- ============================================
CREATE OR REPLACE FUNCTION add_aura_points(
  target_user_id UUID,
  points_to_add INTEGER,
  source_type TEXT DEFAULT 'system',
  source_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER AS $$
DECLARE
  new_score INTEGER;
BEGIN
  -- Update profiles.aura_score
  UPDATE public.profiles
  SET aura_score = COALESCE(aura_score, 0) + points_to_add
  WHERE id = target_user_id
  RETURNING aura_score INTO new_score;
  
  -- Log to points_ledger (optional but recommended)
  INSERT INTO public.points_ledger (user_id, source, amount, meta)
  VALUES (target_user_id, source_type, points_to_add, source_meta);
  
  RETURN COALESCE(new_score, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_aura_points(UUID, INTEGER, TEXT, JSONB) TO authenticated;

-- ============================================
-- 10. Optional: Create trigger to update updated_at on comments
-- ============================================
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comments_updated_at ON public.comments;
CREATE TRIGGER trigger_update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();

-- ============================================
-- DONE! Your schema is now ready.
-- ============================================
-- Next: Update the code to use 'likes' instead of 'boosts'
--       and 'body' instead of 'content' in comments

