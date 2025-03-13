/*
  # Update Company Name and Admin User

  1. Changes
    - Rename company from '7 Sales Steps' to 'SalesV2'
    - Update domain from '7salessteps.com' to 'salesv2.com'
    - Update admin user email
    - Update all related policies and references

  2. Security
    - Maintain existing security policies
    - Update policy conditions for new domain
*/

-- Update company name and domain
UPDATE companies 
SET name = 'SalesV2',
    domain = 'salesv2.com'
WHERE domain = '7salessteps.com';

-- Update admin user email in auth.users
UPDATE auth.users 
SET email = 'marius@salesv2.com',
    email_confirmed_at = now(),
    updated_at = now()
WHERE email = 'marius@7salessteps.com';

-- Update user profiles
UPDATE user_profiles 
SET email = 'marius@salesv2.com'
WHERE email = 'marius@7salessteps.com';

-- Update company policies
DO $$ 
BEGIN
  -- Drop existing policies that reference the old domain
  DROP POLICY IF EXISTS "admin_full_access_companies" ON companies;
  DROP POLICY IF EXISTS "admin_full_access_users" ON company_users;

  -- Recreate policies with new domain
  CREATE POLICY "admin_full_access_companies"
    ON companies
    FOR ALL
    TO authenticated
    USING ((auth.jwt() ->> 'email'::text) = 'marius@salesv2.com'::text)
    WITH CHECK ((auth.jwt() ->> 'email'::text) = 'marius@salesv2.com'::text);

  CREATE POLICY "admin_full_access_users"
    ON company_users
    FOR ALL
    TO authenticated
    USING ((auth.jwt() ->> 'email'::text) = 'marius@salesv2.com'::text)
    WITH CHECK ((auth.jwt() ->> 'email'::text) = 'marius@salesv2.com'::text);
END $$;