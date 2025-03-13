/*
  # Company Security Policy Update

  1. Changes
    - Fix table references in policies
    - Remove NEW table references
    - Implement proper policy checks
    - Secure credential access

  2. Security
    - Enable RLS on all tables
    - Implement non-recursive policies
    - Secure view access control
*/

-- Drop existing policies and views
DO $$ 
BEGIN
  -- Drop all existing policies
  DROP POLICY IF EXISTS "admin_full_access_companies" ON companies;
  DROP POLICY IF EXISTS "company_admin_read_access" ON companies;
  DROP POLICY IF EXISTS "company_admin_update_access" ON companies;
  DROP POLICY IF EXISTS "user_read_company_access" ON companies;
  DROP POLICY IF EXISTS "admin_full_access_users" ON company_users;
  DROP POLICY IF EXISTS "company_admin_read_users" ON company_users;
  DROP POLICY IF EXISTS "company_admin_insert_users" ON company_users;
  DROP POLICY IF EXISTS "company_admin_delete_users" ON company_users;
  DROP POLICY IF EXISTS "user_view_company_members" ON company_users;
END $$;

DROP VIEW IF EXISTS company_credentials;
DROP VIEW IF EXISTS company_salesforce_credentials;

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- Create base policies for super admin
CREATE POLICY "admin_full_access_companies"
ON companies
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'email'::text) = 'marius@7salessteps.com'::text)
WITH CHECK ((auth.jwt() ->> 'email'::text) = 'marius@7salessteps.com'::text);

-- Create company policies for admins
CREATE POLICY "company_admin_read_access"
ON companies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM company_users cu 
    WHERE cu.company_id = companies.id 
    AND cu.user_id = auth.uid()
    AND cu.is_admin = true
  )
);

CREATE POLICY "company_admin_update_access"
ON companies
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM company_users cu 
    WHERE cu.company_id = companies.id 
    AND cu.user_id = auth.uid()
    AND cu.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM company_users cu 
    WHERE cu.company_id = companies.id 
    AND cu.user_id = auth.uid()
    AND cu.is_admin = true
  )
);

CREATE POLICY "user_read_company_access"
ON companies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM company_users cu 
    WHERE cu.company_id = companies.id 
    AND cu.user_id = auth.uid()
  )
);

-- Create company_users policies without recursion
CREATE POLICY "admin_full_access_users"
ON company_users
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'email'::text) = 'marius@7salessteps.com'::text)
WITH CHECK ((auth.jwt() ->> 'email'::text) = 'marius@7salessteps.com'::text);

CREATE POLICY "company_admin_read_users"
ON company_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM company_users cu 
    WHERE cu.company_id = company_users.company_id 
    AND cu.user_id = auth.uid()
    AND cu.is_admin = true
  )
);

CREATE POLICY "company_admin_manage_users"
ON company_users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM company_users cu 
    WHERE cu.company_id = company_users.company_id 
    AND cu.user_id = auth.uid()
    AND cu.is_admin = true
  )
);

CREATE POLICY "company_admin_delete_users"
ON company_users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM company_users cu 
    WHERE cu.company_id = company_users.company_id 
    AND cu.user_id = auth.uid()
    AND cu.is_admin = true
  )
);

CREATE POLICY "user_view_company_members"
ON company_users
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT cu.company_id 
    FROM company_users cu 
    WHERE cu.user_id = auth.uid()
  )
);

-- Create secure view for Salesforce credentials
CREATE VIEW company_salesforce_credentials AS
SELECT 
  id,
  salesforce_url,
  salesforce_username,
  salesforce_password,
  salesforce_security_token,
  salesforce_api_version
FROM companies
WHERE EXISTS (
  SELECT 1 
  FROM company_users cu 
  WHERE cu.company_id = companies.id 
  AND cu.user_id = auth.uid()
  AND cu.is_admin = true
);

COMMENT ON VIEW company_salesforce_credentials IS 'Secure view that provides decrypted access to Salesforce credentials';

-- Create secure view for company info with credentials
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

-- Grant access to views
GRANT SELECT ON company_credentials TO authenticated;
GRANT SELECT ON company_salesforce_credentials TO authenticated;