/*
  # Add account column to actions table

  1. Changes
    - Add `account` column to `actions` table to store the company domain
    - Make `account` column required to ensure data consistency
    - Add index on `account` column for better query performance

  2. Security
    - No changes to RLS policies needed
*/

-- Add account column
ALTER TABLE actions 
ADD COLUMN IF NOT EXISTS account text NOT NULL DEFAULT '';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS actions_account_idx ON actions (account);