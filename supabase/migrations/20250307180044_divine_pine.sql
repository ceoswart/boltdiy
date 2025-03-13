/*
  # Create Admin User with Email Constraint
  
  This migration:
  1. Creates a unique constraint on auth.users email column if it doesn't exist
  2. Creates the admin user with proper password hashing
  3. Sets up the admin profile
*/

-- First ensure we have a unique constraint on email
DO $$ 
BEGIN
  -- Check if the constraint doesn't already exist
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'users_email_key'
  ) THEN
    ALTER TABLE auth.users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END $$;

-- Now create the admin user
DO $$ 
DECLARE 
  new_user_id uuid;
BEGIN
  -- Insert the user with a new UUID
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token
  )
  VALUES (
    gen_random_uuid(),
    'marius@7salessteps.com',
    crypt('123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    'authenticated',
    'authenticated',
    encode(digest(gen_random_uuid()::text, 'sha256'), 'hex')
  )
  RETURNING id INTO new_user_id;

  -- Create the admin profile
  INSERT INTO public.profiles (id, first_name, last_name, is_admin)
  VALUES (new_user_id, '', '', true)
  ON CONFLICT (id) DO UPDATE
  SET is_admin = true;

EXCEPTION
  -- Handle the case where the user already exists
  WHEN unique_violation THEN
    -- Get the existing user's ID
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'marius@7salessteps.com';
    
    -- Update the existing user
    UPDATE auth.users 
    SET 
      encrypted_password = crypt('123', gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at = now()
    WHERE id = new_user_id;

    -- Ensure profile exists
    INSERT INTO public.profiles (id, first_name, last_name, is_admin)
    VALUES (new_user_id, '', '', true)
    ON CONFLICT (id) DO UPDATE
    SET is_admin = true;
END $$;