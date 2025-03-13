/*
  # Fix column naming consistency

  1. Changes
    - Ensure consistent column naming for action_path_id
    - Add missing indexes for performance
    - Add missing foreign key constraints

  2. Security
    - No security changes needed (policies already in place)
*/

-- Fix column naming
DO $$
BEGIN
  -- Rename column if it exists with wrong name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'actions' 
    AND column_name = 'actionpathid'
  ) THEN
    ALTER TABLE actions RENAME COLUMN actionpathid TO action_path_id;
  END IF;

  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'actions' 
    AND column_name = 'action_path_id'
  ) THEN
    ALTER TABLE actions ADD COLUMN action_path_id uuid REFERENCES action_paths(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_actions_action_path_id ON actions(action_path_id);
CREATE INDEX IF NOT EXISTS idx_actions_user_id ON actions(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_assigned_to ON actions(assigned_to);