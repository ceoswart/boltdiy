/*
  # Company and User Management Security Update

  1. Changes
    - Drop and recreate all policies with unique names
    - Implement proper access control hierarchy
    - Add secure view for credentials
    - Fix policy naming conflicts

  2. Security
    - Enable RLS on both tables
    - Implement role-based access control
    - Secure credential access
*/

-- Drop ALL existing policies to ensure clean slate
DO $$ 
BEGIN
  -- Drop companies policies
  DROP POLICY IF EXISTS "Super admin can manage all" ON companies;
  DROP POLICY IF EXISTS "Company admins can view and update" ON companies;
  DROP POLICY IF EXISTS "Company admins can update settings" ON companies;
  DROP POLICY IF EXISTS "Users can view basic company info" ON companies;
  DROP POLICY IF EXISTS "Super admin can manage all users" ON company_users;
  DROP POLICY IF EXISTS "Company admins can view users" ON company_users;
  DROP POLICY IF EXISTS "Company admins can manage users" ON company_users;
  DROP POLICY IF EXISTS "Company admins can remove users" ON company_users;
  DROP POLICY IF EXISTS "7 Sales admin can manage companies" ON companies;
  DROP POLICY IF EXISTS "Company admins can update Salesforce credentials" ON companies;
  DROP POLICY IF EXISTS "Company admins can view Salesforce credentials" ON companies;
  DROP POLICY IF EXISTS "Company admins can manage their company" ON companies;
  DROP POLICY IF EXISTS "Users can view their company" ON companies;
  DROP POLICY IF EXISTS "Company admins can manage users" ON company_users;
  DROP POLICY IF EXISTS "Users can view company members" ON company_users;
  DROP POLICY IF EXISTS "7 Sales admin can manage all companies" ON companies;
  DROP POLICY IF EXISTS "Company admins can read credentials" ON companies;
  DROP POLICY IF EXISTS "Company admins can update company" ON companies;
  DROP POLICY IF EXISTS "Users can view their company info" ON companies;
  DROP POLICY IF EXISTS "7 Sales admin can manage all company users" ON company_users;
  DROP POLICY IF EXISTS "Company admins can read users" ON company_users;
  DROP POLICY IF EXISTS "Company admins can add users" ON company_users;
  DROP POLICY IF EXISTS "Company admins can delete users" ON company_users;
  DROP POLICY IF EXISTS "Users can view their company members" ON company_users;
END $$;

-- Drop existing view
DROP VIEW IF EXISTS company_credentials;

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- Create policies for companies table with unique names
CREATE POLICY "admin_full_access_companies"
ON companies
FOR ALL
TO authenticated
USING (auth.email() = 'marius@7salessteps.com')
WITH CHECK (auth.email() = 'marius@7salessteps.com');

CREATE POLICY "company_admin_read_access"
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

CREATE POLICY "company_admin_update_access"
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

CREATE POLICY "user_read_company_access"
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

-- Create policies for company_users table with unique names
CREATE POLICY "admin_full_access_users"
ON company_users
FOR ALL
TO authenticated
USING (auth.email() = 'marius@7salessteps.com')
WITH CHECK (auth.email() = 'marius@7salessteps.com');

CREATE POLICY "company_admin_read_users"
ON company_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM company_users admin_check
    WHERE admin_check.company_id = company_users.company_id 
    AND admin_check.user_id = auth.uid()
    AND admin_check.is_admin = true
  )
);

CREATE POLICY "company_admin_insert_users"
ON company_users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM company_users admin_check
    WHERE admin_check.company_id = company_users.company_id 
    AND admin_check.user_id = auth.uid()
    AND admin_check.is_admin = true
  )
);

CREATE POLICY "company_admin_delete_users"
ON company_users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM company_users admin_check
    WHERE admin_check.company_id = company_users.company_id 
    AND admin_check.user_id = auth.uid()
    AND admin_check.is_admin = true
  )
);

CREATE POLICY "user_view_company_members"
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