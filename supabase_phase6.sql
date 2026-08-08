-- Phase 6 Migration: Profile Edit Controls
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS edit_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_edit_profile BOOLEAN DEFAULT FALSE;
