/*
  # Company Management Schema

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `name` (text)
      - `domain` (text, unique)
      - `is_approved` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `company_users`
      - `id` (uuid, primary key)
      - `company_id` (uuid, references companies)
      - `user_id` (uuid, references auth.users)
      - `is_admin` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Policies for:
      - 7 Sales Steps admin can manage all companies
      - Company admins can manage their own company
      - Users can only view their own company
      - Users can only be added to companies matching their email domain

  3. Functions
    - Function to validate user email domain matches company domain
    - Function to auto-create company user entry on user signup
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text NOT NULL UNIQUE,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create company_users table
CREATE TABLE IF NOT EXISTS company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- Create domain validation function
CREATE OR REPLACE FUNCTION validate_user_domain() 
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM companies c
    WHERE c.domain = split_part(NEW.email, '@', 2)
    AND c.is_approved = true
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Allow 7 Sales Steps admin
  IF NEW.email = 'marius@7salessteps.com' THEN
    RETURN NEW;
  END IF;
  
  RAISE EXCEPTION 'Email domain not allowed';
END;
$$ LANGUAGE plpgsql;

-- Create trigger for domain validation
CREATE TRIGGER validate_user_domain_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_domain();

-- Create function to auto-create company user
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO company_users (company_id, user_id, is_admin)
  SELECT c.id, NEW.id, false
  FROM companies c
  WHERE c.domain = split_part(NEW.email, '@', 2);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto company user creation
CREATE TRIGGER handle_new_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create policies for companies table
CREATE POLICY "7 Sales admin can manage all companies"
  ON companies
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'marius@7salessteps.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'marius@7salessteps.com'
    )
  );

CREATE POLICY "Company admins can manage their company"
  ON companies
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users
      WHERE user_id = auth.uid()
      AND company_id = companies.id
      AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_users
      WHERE user_id = auth.uid()
      AND company_id = companies.id
      AND is_admin = true
    )
  );

CREATE POLICY "Users can view their company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users
      WHERE user_id = auth.uid()
      AND company_id = companies.id
    )
  );

-- Create policies for company_users table
CREATE POLICY "7 Sales admin can manage all company users"
  ON company_users
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'marius@7salessteps.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email = 'marius@7salessteps.com'
    )
  );

CREATE POLICY "Company admins can manage company users"
  ON company_users
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.user_id = auth.uid()
      AND cu.company_id = company_users.company_id
      AND cu.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.user_id = auth.uid()
      AND cu.company_id = company_users.company_id
      AND cu.is_admin = true
    )
  );

CREATE POLICY "Users can view their company users"
  ON company_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.user_id = auth.uid()
      AND cu.company_id = company_users.company_id
    )
  );

-- Insert initial 7 Sales Steps company
INSERT INTO companies (name, domain, is_approved)
VALUES ('7 Sales Steps', '7salessteps.com', true)
ON CONFLICT (domain) DO NOTHING;