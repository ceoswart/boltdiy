/*
  # Add tags column to actions table

  1. Changes
    - Add `tags` column to `actions` table as a text array to store tag IDs
    
  2. Notes
    - Using text[] type to store tag IDs
    - Column is nullable since not all actions need tags
*/

ALTER TABLE public.actions
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';