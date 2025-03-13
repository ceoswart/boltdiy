/*
  # Add tags and assignee colors

  1. Changes
    - Add tags table for storing tag definitions
    - Add action_tags table for many-to-many relationship between actions and tags
    - Add color column to assignees table
    - Fix column name issue in actions table

  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tags"
  ON tags
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create action_tags table
CREATE TABLE IF NOT EXISTS action_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid REFERENCES actions(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE action_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tags for own actions"
  ON action_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM actions
      WHERE actions.id = action_tags.action_id
      AND actions.user_id = auth.uid()
    )
  );

-- Add color column to assignees
ALTER TABLE assignees ADD COLUMN IF NOT EXISTS color text;

-- Fix column name in actions table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'actions' AND column_name = 'actionpathid'
  ) THEN
    ALTER TABLE actions RENAME COLUMN actionpathid TO action_path_id;
  END IF;
END $$;

-- Add trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();