/*
  # Add user profiles and roles schema

  1. New Tables
    - `user_roles` - Defines available user roles
      - `id` (uuid, primary key)
      - `name` (text) - Role name
      - `description` (text) - Role description
      - `permissions` (text[]) - List of permissions
      - `created_at` (timestamptz)
    
    - `user_profiles` - Extended user profile information
      - `id` (uuid, primary key)
      - `user_id` (uuid) - References auth.users
      - `role_id` (uuid) - References user_roles
      - `company_id` (uuid) - References companies
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text)
      - `image_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add domain validation trigger to user_profiles
    - Add RLS policies for user profiles and roles
    - Add default roles

  3. Security
    - Enable RLS on all new tables
    - Add policies for role-based access
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  permissions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES user_roles(id),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

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
CREATE TRIGGER validate_user_profile_domain_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_profile_domain();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO user_roles (name, description, permissions) VALUES
  ('super_admin', 'Super administrator with full system access', '{all}'),
  ('admin', 'Company administrator', '{manage_users,manage_assignees,manage_settings}'),
  ('user', 'Regular user', '{view,edit}'),
  ('assignee', 'Task assignee', '{view_assigned,update_assigned}'),
  ('viewer', 'Read-only access', '{view}')
ON CONFLICT DO NOTHING;

-- Create RLS policies for user_roles
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

CREATE POLICY "Users can view roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create RLS policies for user_profiles
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

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());