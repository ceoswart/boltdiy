/*
  # Initial Schema Setup

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `image_url` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `action_paths`
      - `id` (uuid, primary key)
      - `name` (text)
      - `deal_size` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, foreign key)
    
    - `territories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `regions` (text[])
      - `action_path_id` (uuid, foreign key)
    
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `action_path_id` (uuid, foreign key)
    
    - `actions`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `target_date` (date)
      - `assigned_to` (uuid, foreign key)
      - `action_path_id` (uuid, foreign key)
      - `methodology` (text, nullable)
      - `source` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Action Paths table
CREATE TABLE IF NOT EXISTS action_paths (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  deal_size text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE
);

-- Territories table
CREATE TABLE IF NOT EXISTS territories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  regions text[] NOT NULL,
  action_path_id uuid REFERENCES action_paths(id) ON DELETE CASCADE
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text NOT NULL,
  action_path_id uuid REFERENCES action_paths(id) ON DELETE CASCADE
);

-- Actions table
CREATE TABLE IF NOT EXISTS actions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  target_date date NOT NULL,
  assigned_to uuid REFERENCES users(id),
  action_path_id uuid REFERENCES action_paths(id) ON DELETE CASCADE,
  methodology text,
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read and update their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Action paths policies
CREATE POLICY "Users can read own action paths" ON action_paths
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own action paths" ON action_paths
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own action paths" ON action_paths
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own action paths" ON action_paths
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Territories policies
CREATE POLICY "Users can read territories of own action paths" ON territories
  FOR SELECT TO authenticated
  USING (
    action_path_id IN (
      SELECT id FROM action_paths WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage territories of own action paths" ON territories
  FOR ALL TO authenticated
  USING (
    action_path_id IN (
      SELECT id FROM action_paths WHERE user_id = auth.uid()
    )
  );

-- Products policies
CREATE POLICY "Users can read products of own action paths" ON products
  FOR SELECT TO authenticated
  USING (
    action_path_id IN (
      SELECT id FROM action_paths WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage products of own action paths" ON products
  FOR ALL TO authenticated
  USING (
    action_path_id IN (
      SELECT id FROM action_paths WHERE user_id = auth.uid()
    )
  );

-- Actions policies
CREATE POLICY "Users can read actions of own action paths" ON actions
  FOR SELECT TO authenticated
  USING (
    action_path_id IN (
      SELECT id FROM action_paths WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage actions of own action paths" ON actions
  FOR ALL TO authenticated
  USING (
    action_path_id IN (
      SELECT id FROM action_paths WHERE user_id = auth.uid()
    )
  );