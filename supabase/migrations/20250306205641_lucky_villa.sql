/*
  # Add missing columns and fix schema

  1. Changes
    - Add `account` column to actions table
    - Add `is_admin` column to profiles table
    - Set default timestamps for all tables
    - Enable RLS on all tables
    - Add appropriate policies

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Add account column to actions table
ALTER TABLE actions ADD COLUMN IF NOT EXISTS account text NOT NULL DEFAULT '';

-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Set default timestamps for all tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'action_paths' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE action_paths 
    ADD COLUMN created_at timestamptz DEFAULT now(),
    ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'actions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE actions 
    ADD COLUMN created_at timestamptz DEFAULT now(),
    ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE action_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_path_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_path_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies with existence checks
DO $$
BEGIN
  -- Action paths policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'action_paths' 
    AND policyname = 'Users can manage own action paths'
  ) THEN
    CREATE POLICY "Users can manage own action paths"
    ON action_paths
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Action path territories policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'action_path_territories' 
    AND policyname = 'Users can manage territories for own action paths'
  ) THEN
    CREATE POLICY "Users can manage territories for own action paths"
    ON action_path_territories
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM action_paths
        WHERE action_paths.id = action_path_territories.action_path_id
        AND action_paths.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM action_paths
        WHERE action_paths.id = action_path_territories.action_path_id
        AND action_paths.user_id = auth.uid()
      )
    );
  END IF;

  -- Action path products policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'action_path_products' 
    AND policyname = 'Users can manage products for own action paths'
  ) THEN
    CREATE POLICY "Users can manage products for own action paths"
    ON action_path_products
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM action_paths
        WHERE action_paths.id = action_path_products.action_path_id
        AND action_paths.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM action_paths
        WHERE action_paths.id = action_path_products.action_path_id
        AND action_paths.user_id = auth.uid()
      )
    );
  END IF;

  -- Actions policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'actions' 
    AND policyname = 'Users can manage own actions'
  ) THEN
    CREATE POLICY "Users can manage own actions"
    ON actions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;