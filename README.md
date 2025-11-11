# Event Registration and QR-Based Attendance System

A web-based Event Registration Platform that allows organisers (admins) to manage events and participants (users) to register easily, with QR code–based attendance tracking.

## Features

- **User and Admin Authentication**: Separate login flows for users and admins
- **Event Management (Admin)**: Full CRUD operations for events with poster upload
- **Event Registration (User)**: Easy event registration with auto-filled user details
- **QR Code Generation**: Unique QR codes generated for each event registration
- **QR Code Scanning**: Admin can scan QR codes to mark attendance and view participant details

## Tech Stack

- React 19
- Vite
- Supabase (Authentication, Database, Storage)
- React Router DOM
- QRCode.js (QR code generation)
- html5-qrcode (QR code scanning)

## Setup Instructions

### 1. Database Setup

Run the SQL commands in `database_schema.sql` in your Supabase SQL Editor. This will create:

- `events` table - stores event information
- `user_details` table - stores additional user information (registration number, phone, etc.)
- `event_registrations` table - stores user registrations with QR codes
- Row Level Security (RLS) policies
- Indexes for better performance

**Note**: You already have the `profiles` table created. The schema assumes it exists.

### 2. Storage Bucket Setup

Create a storage bucket in Supabase for event posters:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `event-posters`
3. Set it to **Public** (or configure policies as needed)
4. Add a policy to allow authenticated users to upload files:

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

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under API.

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── ProtectedRouted.jsx    # Route protection component
│   └── QRScanner.jsx           # QR code scanner for attendance
├── pages/
│   ├── Auth.jsx                # Login/Register page
│   ├── Events.jsx              # Public events viewing page
│   ├── DashboardAdmin.jsx      # Admin dashboard with event CRUD
│   └── DashboardUser.jsx       # User dashboard with registration
├── App.jsx                     # Main app component with routing
├── supabaseClient.js           # Supabase client configuration
└── main.jsx                    # Entry point
```

## Database Tables

### 1. `profiles` (Already created by you)
- Stores user and admin profiles
- Links to `auth.users` via foreign key

### 2. `events`
- Stores event information
- Fields: id, title, description, support_contact, poster_url, is_approved, created_by, created_at, updated_at

### 3. `user_details`
- Stores additional user information
- Fields: id, registration_number, phone_number, created_at, updated_at

### 4. `event_registrations`
- Stores event registrations with QR codes
- Fields: id, event_id, user_id, qr_code, additional_details, attendance_marked, attendance_marked_at, registered_at

## Usage

### For Admins

1. Login with an admin account (role must be 'admin' in profiles table)
2. Create events with title, description, contact, and poster
3. Approve events to make them visible to users
4. Use the QR scanner to mark attendance during events

### For Users

1. View all approved events on the home page (no login required)
2. Register for an account
3. Complete profile on first registration (Name, Registration Number, Email, Phone)
4. Register for events (details auto-filled after first registration)
5. Receive QR code after registration
6. View registered events and attendance status

## Important Notes

- Admin accounts must be created/assigned manually in the database (set `role = 'admin'` in profiles table)
- Events must be approved by admins to be visible to users
- QR codes are unique per registration and contain event and user information
- Camera permissions are required for QR code scanning

## Troubleshooting

### QR Scanner not working
- Ensure camera permissions are granted
- Try using HTTPS (required for camera access in most browsers)
- Check browser console for errors

### Storage upload failing
- Verify the `event-posters` bucket exists
- Check storage policies are correctly set
- Ensure user is authenticated

### Authentication issues
- Verify Supabase credentials in `.env` file
- Check RLS policies are correctly configured
- Ensure profiles table has correct role values

## License

MIT
