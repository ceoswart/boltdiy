/*
  # Fix User Validation and Management

  1. Changes
    - Drop triggers and functions in correct order
    - Create new validation function with proper checks
    - Add missing indexes for performance
    - Fix domain validation logic

  2. Security
    - Maintain RLS policies
    - Ensure proper validation
*/

-- First drop the triggers that depend on the functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS validate_user_profile_domain_trigger ON user_profiles;

-- Then drop the functions
DROP FUNCTION IF EXISTS validate_user_profile_domain();
DROP FUNCTION IF EXISTS handle_new_user();

-- Create new domain validation function
CREATE OR REPLACE FUNCTION validate_user_profile_domain()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow super admin
  IF NEW.email = 'marius@salesv2.com' THEN
    RETURN NEW;
  END IF;

  -- Check if user's email domain matches company domain
  IF EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = NEW.company_id
    AND split_part(NEW.email, '@', 2) = c.domain
  ) THEN
    RETURN NEW;
  END IF;

  -- Allow if company doesn't exist yet (for initial setup)
  IF NOT EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = NEW.company_id
  ) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Email domain must match company domain';
END;
$$ LANGUAGE plpgsql;

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
  
  -- Get appropriate role
  IF NEW.email = 'marius@salesv2.com' THEN
    SELECT id INTO v_role_id FROM user_roles WHERE name = 'super_admin';
  ELSE
    SELECT id INTO v_role_id FROM user_roles WHERE name = 'user';
  END IF;

  -- Create profile
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
    COALESCE(v_company_id, NEW.raw_app_meta_data->>'company_id'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER validate_user_profile_domain_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_profile_domain();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);