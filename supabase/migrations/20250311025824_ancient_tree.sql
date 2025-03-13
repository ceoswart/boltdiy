/*
  # Add parameters to action paths

  1. New Columns
    - `sales_cycle_days` (integer) - Estimated length of sales cycle in days
    - `estimated_value` (integer) - Estimated deal value in dollars
    - `confidence_factor` (integer) - Confidence percentage (0-100)

  2. Changes
    - Add new columns to action_paths table
    - Set default values for existing rows
*/

ALTER TABLE action_paths
ADD COLUMN IF NOT EXISTS sales_cycle_days integer DEFAULT 30 CHECK (sales_cycle_days > 0),
ADD COLUMN IF NOT EXISTS estimated_value integer DEFAULT 10000 CHECK (estimated_value >= 0),
ADD COLUMN IF NOT EXISTS confidence_factor integer DEFAULT 50 CHECK (confidence_factor >= 0 AND confidence_factor <= 100);