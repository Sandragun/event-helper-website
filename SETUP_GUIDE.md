# Quick Setup Guide

## Step 1: Run Database Schema

Copy and paste the entire contents of `database_schema.sql` into your Supabase SQL Editor and execute it.

This will create:
- ✅ `events` table
- ✅ `user_details` table  
- ✅ `event_registrations` table
- ✅ All RLS policies
- ✅ Indexes and triggers

## Step 2: Create Storage Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Name: `event-posters`
4. Make it **Public**
5. Click **Create bucket**

Then run this SQL in the SQL Editor to set up policies:

```sql
-- Policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload posters"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-posters');

-- Policy for public read access
CREATE POLICY "Public can view posters"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-posters');
```

## Step 3: Set Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-api-key
```

- Supabase values are in **Settings → API**
- Generate a Gemini key at [Google AI Studio](https://aistudio.google.com/)

## Step 4: Install and Run

```bash
npm install
npm run dev
```

## Step 5: Create an Admin Account

1. Register a new user account through the app
2. Go to Supabase Dashboard → Table Editor → `profiles`
3. Find your user and change `role` from `'user'` to `'admin'`
4. Now you can login as admin!

## Step 6: Try the Chatbot

- Open the user dashboard and click the 💬 Chatbot button
- The Gemini assistant will ask for missing profile details and help register users
- All conversations are logged via your webhook with profile identifiers

## That's it! 🎉

- Visit `/` to see public events
- Login as user to register for events or chat with the bot
- Login as admin to manage events, preview posters, and scan QR codes

