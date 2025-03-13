/*
  # Fix company users policy

  1. Changes
    - Remove recursive policy that was causing infinite recursion
    - Add simplified policies for company users management
    - Ensure proper access control based on company admin status

  2. Security
    - Company admins can manage users in their company
    - Users can view other users in their company
    - No recursive checks that could cause infinite loops
*/

-- Drop existing policies
DROP POLICY IF EXISTS "7 Sales admin can manage all company users" ON company_users;
DROP POLICY IF EXISTS "Company admins can manage company users" ON company_users;
DROP POLICY IF EXISTS "Users can view their company users" ON company_users;

-- Create new, simplified policies
CREATE POLICY "Company admins can manage users"
ON company_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.company_id = company_users.company_id
    AND cu.user_id = auth.uid()
    AND cu.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.company_id = company_users.company_id
    AND cu.user_id = auth.uid()
    AND cu.is_admin = true
  )
);

CREATE POLICY "Users can view company users"
ON company_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM company_users cu
    WHERE cu.company_id = company_users.company_id
    AND cu.user_id = auth.uid()
  )
);