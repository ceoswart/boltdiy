/*
  # Add Salesforce Integration Support

  1. Changes
    - Add Salesforce credential columns to companies table
    - Add encryption support for sensitive data
    - Create secure view for credential access
    - Set up RLS policies for credential management

  2. Security
    - Encrypt sensitive credentials (password, tokens, secrets)
    - RLS policies to restrict access to company admins
    - Secure functions for encryption/decryption
*/

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add Salesforce credential columns to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS salesforce_url text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS salesforce_username text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS salesforce_password text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS salesforce_security_token text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS salesforce_client_id text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS salesforce_client_secret text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS salesforce_api_version text DEFAULT '57.0';

-- Create a function to encrypt values
CREATE OR REPLACE FUNCTION encrypt_value(value text)
RETURNS text AS $$
BEGIN
  IF value IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN encode(encrypt(value::bytea, current_setting('app.encryption_key')::bytea, 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to decrypt values
CREATE OR REPLACE FUNCTION decrypt_value(encrypted_value text)
RETURNS text AS $$
BEGIN
  IF encrypted_value IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN convert_from(
    decrypt(
      decode(encrypted_value, 'base64'),
      current_setting('app.encryption_key')::bytea,
      'aes'
    ),
    'utf8'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_company_credentials()
RETURNS trigger AS $$
BEGIN
  IF NEW.salesforce_password IS NOT NULL THEN
    NEW.salesforce_password = encrypt_value(NEW.salesforce_password);
  END IF;
  
  IF NEW.salesforce_security_token IS NOT NULL THEN
    NEW.salesforce_security_token = encrypt_value(NEW.salesforce_security_token);
  END IF;
  
  IF NEW.salesforce_client_secret IS NOT NULL THEN
    NEW.salesforce_client_secret = encrypt_value(NEW.salesforce_client_secret);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS encrypt_credentials_trigger ON companies;

-- Create encryption trigger
CREATE TRIGGER encrypt_credentials_trigger
  BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_company_credentials();

-- Create a secure view that decrypts the sensitive data
CREATE OR REPLACE VIEW company_salesforce_credentials AS
SELECT
  id,
  salesforce_url,
  salesforce_username,
  decrypt_value(salesforce_password) as salesforce_password,
  decrypt_value(salesforce_security_token) as salesforce_security_token,
  salesforce_client_id,
  decrypt_value(salesforce_client_secret) as salesforce_client_secret,
  salesforce_api_version
FROM companies;

-- Set proper ownership
ALTER VIEW company_salesforce_credentials OWNER TO postgres;

-- Set up RLS on the base table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Company admins can view Salesforce credentials" ON companies;
DROP POLICY IF EXISTS "Company admins can update Salesforce credentials" ON companies;

-- Policy for viewing company credentials
CREATE POLICY "Company admins can view Salesforce credentials"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users
      WHERE company_users.company_id = companies.id
      AND company_users.user_id = auth.uid()
      AND company_users.is_admin = true
    )
  );

-- Policy for updating company credentials
CREATE POLICY "Company admins can update Salesforce credentials"
  ON companies
  FOR UPDATE
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

-- Grant necessary permissions
GRANT SELECT ON company_salesforce_credentials TO authenticated;

-- Comments for documentation
COMMENT ON VIEW company_salesforce_credentials IS 'Secure view that provides decrypted access to Salesforce credentials';
COMMENT ON FUNCTION encrypt_value(text) IS 'Encrypts a value using AES encryption';
COMMENT ON FUNCTION decrypt_value(text) IS 'Decrypts a value that was encrypted using encrypt_value()';