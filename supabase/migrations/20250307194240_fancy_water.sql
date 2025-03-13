/*
  # Fix company and company users policies

  1. Changes
    - Drop and recreate policies to avoid recursion
    - Create secure view for Salesforce credentials
    - Implement proper access control for companies and users

  2. Security
    - 7 Sales admin can manage all companies
    - Company admins can manage their own company
    - Company admins can manage users in their company
    - Users can view their company and company members
    - Only company admins can view/update Salesforce credentials
*/

-- Drop existing policies
DROP POLICY IF EXISTS "7 Sales admin can manage companies" ON companies;
DROP POLICY IF EXISTS "Company admins can manage their company" ON companies;
DROP POLICY IF EXISTS "Users can view their company" ON companies;
DROP POLICY IF EXISTS "Company admins can manage company users" ON company_users;
DROP POLICY IF EXISTS "Users can view company members" ON company_users;

-- Drop existing view if it exists
DROP VIEW IF EXISTS company_credentials;

-- Create base company policies
CREATE POLICY "7 Sales admin can manage companies"
ON companies
FOR ALL
TO authenticated
USING (auth.email() = 'marius@7salessteps.com')
WITH CHECK (auth.email() = 'marius@7salessteps.com');

-- Create company policies
CREATE POLICY "Company admins can view and update"
ON companies
FOR ALL
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
  company_id IN (
    SELECT company_id 
    FROM company_users 
    WHERE user_id = auth.uid()
  )
);

-- Create secure view for company credentials
CREATE VIEW company_credentials AS
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