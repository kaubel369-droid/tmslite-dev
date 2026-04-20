-- Migration: Add note columns to loads table
ALTER TABLE public.loads 
ADD COLUMN IF NOT EXISTS internal_notes text,
ADD COLUMN IF NOT EXISTS bol_notes text,
ADD COLUMN IF NOT EXISTS tracing_notes text;

-- If there was a generic 'notes' column, we keep it for now but the UI will move to these.
-- Based on the scan, there isn't actually a 'notes' column in the database yet, 
-- even though the UI was trying to use it.
