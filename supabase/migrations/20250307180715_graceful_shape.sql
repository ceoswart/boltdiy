/*
  # Fix RLS policies for actions table

  1. Security
    - Enable RLS on actions table
    - Drop existing policies to avoid conflicts
    - Add policies for authenticated users to:
      - Insert their own actions
      - Select actions they own or are assigned to
      - Update their own actions
      - Delete their own actions

  2. Changes
    - Enable row level security
    - Drop existing policies
    - Add CRUD policies
*/

-- Enable RLS
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own actions" ON public.actions;
DROP POLICY IF EXISTS "Users can view own actions and assigned actions" ON public.actions;
DROP POLICY IF EXISTS "Users can update own actions" ON public.actions;
DROP POLICY IF EXISTS "Users can delete own actions" ON public.actions;

-- Policy for inserting actions
CREATE POLICY "Users can insert own actions"
ON public.actions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for selecting actions
CREATE POLICY "Users can view own actions and assigned actions"
ON public.actions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  assigned_to = auth.jwt()->>'email' OR
  action_path_id IN (
    SELECT id FROM action_paths WHERE user_id = auth.uid()
  )
);

-- Policy for updating actions
CREATE POLICY "Users can update own actions"
ON public.actions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for deleting actions
CREATE POLICY "Users can delete own actions"
ON public.actions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);