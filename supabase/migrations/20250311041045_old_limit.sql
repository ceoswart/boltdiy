/*
  # User Profiles and Roles System

  1. New Tables
    - `user_roles`: Defines available user roles and their permissions
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `permissions` (text[])
      - `created_at` (timestamp)

    - `user_profiles`: Links users to roles and companies
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role_id` (uuid, references user_roles)
      - `company_id` (uuid, references companies)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text, unique)
      - `image_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for role management
    - Add policies for profile management
    - Add domain validation for user profiles

  3. Functions
    - Add domain validation function
    - Add new user handler function
*/

-- Create user_roles table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    permissions text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now()
  );
  
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_name_key'
  ) THEN
    ALTER TABLE user_roles ADD CONSTRAINT user_roles_name_key UNIQUE (name);
  END IF;
END $$;

-- Create user_profiles table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id uuid REFERENCES user_roles(id),
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    image_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
  
  -- Add unique constraints if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_email_key'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_email_key UNIQUE (email);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_user_id_company_id_key'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_company_id_key UNIQUE (user_id, company_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Insert default roles if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE name = 'super_admin') THEN
    INSERT INTO user_roles (name, description, permissions)
    VALUES
      ('super_admin', 'Super administrator with full system access', ARRAY['all']),
      ('admin', 'Company administrator', ARRAY['manage_users', 'manage_assignees', 'manage_settings']),
      ('user', 'Regular user', ARRAY['view', 'edit']),
      ('assignee', 'Task assignee', ARRAY['view_assigned', 'update_assigned']),
      ('viewer', 'Read-only access', ARRAY['view']);
  END IF;
END $$;

-- Create RLS policies for user_roles
DO $$ BEGIN
  DROP POLICY IF EXISTS "Super admins can manage roles" ON user_roles;
  CREATE POLICY "Super admins can manage roles"
    ON user_roles
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.user_id = auth.uid()
        AND up.role_id = (SELECT id FROM user_roles WHERE name = 'super_admin')
      )
    );

  DROP POLICY IF EXISTS "Users can view roles" ON user_roles;
  CREATE POLICY "Users can view roles"
    ON user_roles
    FOR SELECT
    TO authenticated
    USING (true);
END $$;

-- Create RLS policies for user_profiles
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view profiles in their company" ON user_profiles;
  CREATE POLICY "Users can view profiles in their company"
    ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
      company_id IN (
        SELECT company_id FROM user_profiles
        WHERE user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Admins can manage company profiles" ON user_profiles;
  CREATE POLICY "Admins can manage company profiles"
    ON user_profiles
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles up
        JOIN user_roles ur ON up.role_id = ur.id
        WHERE up.user_id = auth.uid()
        AND up.company_id = user_profiles.company_id
        AND (ur.name = 'admin' OR ur.name = 'super_admin')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_profiles up
        JOIN user_roles ur ON up.role_id = ur.id
        WHERE up.user_id = auth.uid()
        AND up.company_id = user_profiles.company_id
        AND (ur.name = 'admin' OR ur.name = 'super_admin')
      )
    );

  DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
  CREATE POLICY "Users can update own profile"
    ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
END $$;

-- Create domain validation function
CREATE OR REPLACE FUNCTION validate_user_profile_domain()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user's email domain matches company domain
  IF EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = NEW.company_id
    AND split_part(NEW.email, '@', 2) != c.domain
  ) THEN
    RAISE EXCEPTION 'User email domain must match company domain';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create domain validation trigger
DROP TRIGGER IF EXISTS validate_user_profile_domain_trigger ON user_profiles;
CREATE TRIGGER validate_user_profile_domain_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_profile_domain();

-- Create new user handler function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id uuid;
  v_role_id uuid;
  v_domain text;
BEGIN
  -- Get user's email domain
  v_domain := split_part(NEW.email, '@', 2);
  
  -- Find matching company
  SELECT id INTO v_company_id
  FROM companies
  WHERE domain = v_domain;
  
  -- If company exists, create profile
  IF v_domain = '7salessteps.com' THEN
    -- For 7salessteps.com users, use super_admin role
    SELECT id INTO v_role_id
    FROM user_roles
    WHERE name = 'super_admin';
  ELSE
    -- For other users, use regular user role
    SELECT id INTO v_role_id
    FROM user_roles
    WHERE name = 'user';
  END IF;
  
  IF v_company_id IS NOT NULL THEN
    INSERT INTO user_profiles (
      user_id,
      role_id,
      company_id,
      first_name,
      last_name,
      email
    ) VALUES (
      NEW.id,
      v_role_id,
      v_company_id,
      split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1),
      split_part(NEW.raw_user_meta_data->>'full_name', ' ', 2),
      NEW.email
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();