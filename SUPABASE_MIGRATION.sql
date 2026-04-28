-- ============================================
-- Run ALL of this in Supabase SQL Editor
-- ============================================

-- 1. Add time slot columns to existing todos table
ALTER TABLE todos ADD COLUMN IF NOT EXISTS start_time text;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS end_time text;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS task_type text DEFAULT 'custom'; -- 'custom' | 'daily'

-- 2. Create daily_templates table (your reusable daily tasks)
CREATE TABLE IF NOT EXISTS daily_templates (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium',
  start_time text,
  end_time text,
  category text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Row Level Security for daily_templates
ALTER TABLE daily_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own templates"
  ON daily_templates FOR ALL
  USING (auth.uid() = user_id);

-- Verify
SELECT 'todos columns' as check, column_name FROM information_schema.columns WHERE table_name = 'todos' ORDER BY ordinal_position;
SELECT 'templates table' as check, column_name FROM information_schema.columns WHERE table_name = 'daily_templates' ORDER BY ordinal_position;
