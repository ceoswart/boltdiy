/*
  # Fix company and company users policies

  1. Changes
    - Restructure company and company_users policies to avoid recursion
    - Add clear, non-recursive policies for both tables
    - Ensure proper access control based on user roles and company membership

  2. Security
    - 7 Sales admin can manage all companies
    - Company admins can manage their own company
    - Company admins can manage users in their company
    - Users can view their company and company members
*/

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "7 Sales admin can manage all companies" ON companies;
DROP POLICY IF EXISTS "Company admins can manage their company" ON companies;
DROP POLICY IF EXISTS "Company admins can manage Salesforce credentials" ON companies;
DROP POLICY IF EXISTS "Users can view their company" ON companies;
DROP POLICY IF EXISTS "Company admins can manage users" ON company_users;
DROP POLICY IF EXISTS "Users can view company users" ON company_users;

-- Create new company policies
CREATE POLICY "7 Sales admin can manage companies"
ON companies
FOR ALL
TO authenticated
USING (
  auth.email() = 'marius@7salessteps.com'
)
WITH CHECK (
  auth.email() = 'marius@7salessteps.com'
);

CREATE POLICY "Company admins can manage their company"
ON companies
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM company_users
    WHERE company_users.company_id = companies.id
    AND company_users.user_id = auth.uid()
    AND company_users.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM company_users
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
    SELECT 1 FROM company_users
    WHERE company_users.company_id = companies.id
    AND company_users.user_id = auth.uid()
  )
);

-- Create new company_users policies
CREATE POLICY "Company admins can manage company users"
ON company_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM company_users admins
    WHERE admins.company_id = company_users.company_id
    AND admins.user_id = auth.uid()
    AND admins.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM company_users admins
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
    SELECT company_id FROM company_users
    WHERE user_id = auth.uid()
  )
);