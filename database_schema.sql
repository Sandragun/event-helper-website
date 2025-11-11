-- Database Schema for Event Registration and QR-Based Attendance System

-- 1. Profiles table (already created by you)
-- This table stores user and admin profiles

-- 2. Events table - stores event information
CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  support_contact text,
  poster_url text,
  is_approved boolean DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 3. User details table - stores additional user information (registration number, phone, etc.)
CREATE TABLE IF NOT EXISTS public.user_details (
  id uuid NOT NULL,
  registration_number text,
  phone_number text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_details_pkey PRIMARY KEY (id),
  CONSTRAINT user_details_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 4. Event registrations table - stores user registrations for events
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  qr_code text NOT NULL UNIQUE,
  additional_details jsonb,
  attendance_marked boolean DEFAULT false,
  attendance_marked_at timestamp with time zone,
  registered_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_registrations_pkey PRIMARY KEY (id),
  CONSTRAINT event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE,
  CONSTRAINT event_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT event_registrations_unique UNIQUE (event_id, user_id)
) TABLESPACE pg_default;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for events table
-- Anyone can read approved events
CREATE POLICY "Anyone can view approved events" ON public.events
  FOR SELECT USING (is_approved = true);

-- Admins can do everything
CREATE POLICY "Admins can manage all events" ON public.events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Event creators can update their own events
CREATE POLICY "Creators can update their events" ON public.events
  FOR UPDATE USING (created_by = auth.uid());

-- 7. RLS Policies for user_details table
-- Users can read and update their own details
CREATE POLICY "Users can view their own details" ON public.user_details
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can insert their own details" ON public.user_details
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own details" ON public.user_details
  FOR UPDATE USING (id = auth.uid());

-- Admins can view all user details
CREATE POLICY "Admins can view all user details" ON public.user_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 8. RLS Policies for event_registrations table
-- Users can view their own registrations
CREATE POLICY "Users can view their own registrations" ON public.event_registrations
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own registrations
CREATE POLICY "Users can create their own registrations" ON public.event_registrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations" ON public.event_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admins can update attendance
CREATE POLICY "Admins can update attendance" ON public.event_registrations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_is_approved ON public.events(is_approved);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_qr_code ON public.event_registrations(qr_code);

-- 10. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Triggers to automatically update updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_details_updated_at BEFORE UPDATE ON public.user_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

