/*
  # Create Admin User

  This migration:
  1. Creates the admin user account with proper unique constraint handling
  2. Sets up the admin profile
*/

DO $$ 
DECLARE 
  new_user_id uuid;
BEGIN
  -- Insert the user if they don't exist and get their ID
  INSERT INTO auth.users (
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    'marius@7salessteps.com',
    crypt('123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    'authenticated'
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'marius@7salessteps.com'
  )
  RETURNING id INTO new_user_id;

  -- If the user was created, ensure their profile exists
  IF new_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, first_name, last_name, is_admin)
    VALUES (new_user_id, '', '', true);
  END IF;
END $$;