-- Run this in Supabase SQL Editor to add time slot columns
-- Go to: Supabase Dashboard → SQL Editor → New Query → paste this → Run

ALTER TABLE todos ADD COLUMN IF NOT EXISTS start_time text;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS end_time text;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'todos' 
ORDER BY ordinal_position;
