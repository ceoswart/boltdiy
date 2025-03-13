/*
  # Fix Company Policies and Credentials View

  1. Changes
    - Drop and recreate company policies with proper access control
    - Create a secure view for company credentials
    - Set up proper policies for company users management
  
  2. Security
    - Enable RLS for all tables
    - Add policies for admin and user access
    - Create secure view for sensitive data
*/

-- Drop existing view if it exists
DROP VIEW IF EXISTS company_credentials;

-- Drop ALL existing policies (using IF EXISTS to avoid errors)
DROP POLICY IF EXISTS "7 Sales admin can manage companies" ON companies;
DROP POLICY IF EXISTS "Company admins can update Salesforce credentials" ON companies;
DROP POLICY IF EXISTS "Company admins can view Salesforce credentials" ON companies;
DROP POLICY IF EXISTS "Company admins can view and update" ON companies;
DROP POLICY IF EXISTS "Company admins can manage their company" ON companies;
DROP POLICY IF EXISTS "Users can view their company" ON companies;
DROP POLICY IF EXISTS "Company admins can manage users" ON company_users;
DROP POLICY IF EXISTS "Users can view company members" ON company_users;

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- Create base company policies
CREATE POLICY "7 Sales admin can manage companies"
ON companies
FOR ALL
TO authenticated
USING (auth.email() = 'marius@7salessteps.com')
WITH CHECK (auth.email() = 'marius@7salessteps.com');

-- Create company policies for admins
CREATE POLICY "Company admins can read credentials"
ON companies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM company_users 
    WHERE company_users.company_id = companies.id 
    AND company_users.user_id = auth.uid()
    AND company_users.is_admin = true
  )
);

CREATE POLICY "Company admins can update settings"
ON companies
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM company_users 
    WHERE company_users.company_id = companies.id 
    AND company_users.user_id = auth.uid()
    AND company_users.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM company_users 
    WHERE company_users.company_id = companies.id 
    AND company_users.user_id = auth.uid()
    AND company_users.is_admin = true
  )
);

-- Create policy for regular users to view their company
CREATE POLICY "Users can view their company"
ON companies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM company_users 
    WHERE company_users.company_id = companies.id 
    AND company_users.user_id = auth.uid()
  )
);

-- Create company_users policies
CREATE POLICY "Company admins can manage users"
ON company_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM company_users admins
    WHERE admins.company_id = company_users.company_id 
    AND admins.user_id = auth.uid()
    AND admins.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM company_users admins
    WHERE admins.company_id = company_users.company_id 
    AND admins.user_id = auth.uid()
    AND admins.is_admin = true
  )
);

CREATE POLICY "Users can view company members"
ON company_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM company_users viewer
    WHERE viewer.company_id = company_users.company_id 
    AND viewer.user_id = auth.uid()
  )
);

-- Create secure view for company credentials
CREATE OR REPLACE VIEW company_credentials AS
SELECT 
  c.id,
  c.name,
  c.domain,
  c.salesforce_url,
  c.salesforce_username,
  c.salesforce_password,
  c.salesforce_security_token,
  c.salesforce_api_version
FROM companies c
WHERE EXISTS (
  SELECT 1 
  FROM company_users cu
  WHERE cu.company_id = c.id 
  AND cu.user_id = auth.uid()
  AND cu.is_admin = true
);

-- Grant access to the view
GRANT SELECT ON company_credentials TO authenticated;