/*
  # Add assignees and date handling

  1. New Tables
    - `assignees`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text, unique)
      - `image_url` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Add `target_date` column to `actions` table
    - Add foreign key from `actions.assigned_to` to `assignees.id`

  3. Security
    - Enable RLS on `assignees` table
    - Add policies for authenticated users to manage assignees
*/

-- Create assignees table
CREATE TABLE IF NOT EXISTS assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE assignees ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view assignees"
  ON assignees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage assignees"
  ON assignees
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@' || split_part(assignees.email, '@', 2)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email LIKE '%@' || split_part(assignees.email, '@', 2)
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_assignees_updated_at
  BEFORE UPDATE ON assignees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update actions table to reference assignees
ALTER TABLE actions 
  ADD COLUMN IF NOT EXISTS target_date date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES assignees(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_actions_assigned_to ON actions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignees_email_domain ON assignees((split_part(email, '@', 2)));