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

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add Salesforce credential columns
ALTER TABLE companies 
  ADD COLUMN IF NOT EXISTS salesforce_url text,
  ADD COLUMN IF NOT EXISTS salesforce_username text,
  ADD COLUMN IF NOT EXISTS salesforce_password text,
  ADD COLUMN IF NOT EXISTS salesforce_security_token text,
  ADD COLUMN IF NOT EXISTS salesforce_client_id text,
  ADD COLUMN IF NOT EXISTS salesforce_client_secret text,
  ADD COLUMN IF NOT EXISTS salesforce_api_version text DEFAULT '57.0';

-- Create encryption function
CREATE OR REPLACE FUNCTION public.encrypt_value(value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF value IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN encode(encrypt(value::bytea, current_setting('app.encryption_key')::bytea, 'aes'), 'base64');
END;
$$;

ALTER FUNCTION public.encrypt_value(text) OWNER TO postgres;

-- Create decryption function
CREATE OR REPLACE FUNCTION public.decrypt_value(encrypted_value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

ALTER FUNCTION public.decrypt_value(text) OWNER TO postgres;

-- Create trigger function for encryption
CREATE OR REPLACE FUNCTION public.encrypt_company_credentials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.salesforce_password IS DISTINCT FROM OLD.salesforce_password THEN
    NEW.salesforce_password = public.encrypt_value(NEW.salesforce_password);
  END IF;
  
  IF TG_OP = 'INSERT' OR NEW.salesforce_security_token IS DISTINCT FROM OLD.salesforce_security_token THEN
    NEW.salesforce_security_token = public.encrypt_value(NEW.salesforce_security_token);
  END IF;
  
  IF TG_OP = 'INSERT' OR NEW.salesforce_client_secret IS DISTINCT FROM OLD.salesforce_client_secret THEN
    NEW.salesforce_client_secret = public.encrypt_value(NEW.salesforce_client_secret);
  END IF;
  
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.encrypt_company_credentials() OWNER TO postgres;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS encrypt_credentials_trigger ON companies;

-- Create trigger for encryption
CREATE TRIGGER encrypt_credentials_trigger
  BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_company_credentials();

-- Create secure view for decrypted credentials
CREATE OR REPLACE VIEW public.company_credentials AS
SELECT 
  c.id,
  c.name,
  c.domain,
  c.salesforce_url,
  c.salesforce_username,
  public.decrypt_value(c.salesforce_password) as salesforce_password,
  public.decrypt_value(c.salesforce_security_token) as salesforce_security_token,
  c.salesforce_client_id,
  public.decrypt_value(c.salesforce_client_secret) as salesforce_client_secret,
  c.salesforce_api_version
FROM public.companies c
WHERE EXISTS (
  SELECT 1 FROM public.company_users
  WHERE company_users.company_id = c.id
  AND company_users.user_id = auth.uid()
  AND company_users.is_admin = true
);

-- Set proper ownership
ALTER VIEW public.company_credentials OWNER TO postgres;

-- Enable RLS on the base table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Company admins can manage Salesforce credentials" ON public.companies;

-- Create RLS policy for the base table
CREATE POLICY "Company admins can manage Salesforce credentials"
  ON public.companies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users
      WHERE company_users.company_id = companies.id
      AND company_users.user_id = auth.uid()
      AND company_users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_users
      WHERE company_users.company_id = companies.id
      AND company_users.user_id = auth.uid()
      AND company_users.is_admin = true
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT SELECT ON public.company_credentials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;

-- Comments for documentation
COMMENT ON VIEW public.company_credentials IS 'Secure view that provides decrypted access to Salesforce credentials';
COMMENT ON FUNCTION public.encrypt_value(text) IS 'Encrypts a value using AES encryption';
COMMENT ON FUNCTION public.decrypt_value(text) IS 'Decrypts a value that was encrypted using encrypt_value()';