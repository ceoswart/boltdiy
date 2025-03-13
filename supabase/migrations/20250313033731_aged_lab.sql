-- Drop the domain validation trigger
DROP TRIGGER IF EXISTS validate_user_profile_domain_trigger ON user_profiles;

-- Create a more flexible domain validation function
CREATE OR REPLACE FUNCTION validate_user_profile_domain()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow super admin
  IF NEW.email = 'marius@salesv2.com' THEN
    RETURN NEW;
  END IF;

  -- Check if user's email domain matches company domain
  IF EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = NEW.company_id
    AND split_part(NEW.email, '@', 2) = c.domain
  ) THEN
    RETURN NEW;
  END IF;

  -- Allow if company doesn't exist yet (for initial setup)
  IF NOT EXISTS (
    SELECT 1 FROM companies c
    WHERE c.id = NEW.company_id
  ) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Email domain must match company domain';
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with the new function
CREATE TRIGGER validate_user_profile_domain_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_profile_domain();