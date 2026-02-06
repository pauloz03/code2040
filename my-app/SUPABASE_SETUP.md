# Supabase Setup Guide

Follow these steps to set up your Supabase database and storage for the Reports app.

## Step 1: Create the Reports Table

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase-migration.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)

This will create:
- The `reports` table with all required fields
- Indexes for better performance
- Row Level Security (RLS) policies
- Automatic timestamp updates

## Step 2: Create the Storage Bucket

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Name it: `report-photos`
4. Make it **Public** (so photos can be accessed via URL)
5. Click **Create bucket**

## Step 3: Set Up Storage Policies (REQUIRED)

**Important:** You must set up storage policies or photo uploads will fail!

### Option A: Using SQL (Recommended - Faster)

1. Go to **SQL Editor** in Supabase
2. Copy and paste the contents of `storage-policies.sql`
3. Click **Run**

This will create all the necessary policies automatically.

### Option B: Using the UI

1. Go to **Storage** → **Policies** → `report-photos`
2. Click **New Policy**
3. Create an **INSERT** policy:
   - Policy name: "Authenticated users can upload report photos"
   - Allowed operation: INSERT
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'report-photos' AND (storage.foldername(name))[1] = 'reports'`

4. Create a **SELECT** policy:
   - Policy name: "Anyone can view report photos"
   - Allowed operation: SELECT
   - Target roles: `public`
   - Policy definition: `bucket_id = 'report-photos'`

5. Create a **DELETE** policy:
   - Policy name: "Users can delete their own report photos"
   - Allowed operation: DELETE
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'report-photos' AND (storage.foldername(name))[2] = auth.uid()::text`

## Step 4: Verify Your Environment Variables

Make sure your `.env` file (or `.env.local`) has:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find these in:
- Supabase Dashboard → **Settings** → **API**

## That's It!

After completing these steps, your app should work correctly. The reports table will be created and ready to store infrastructure reports.

## Troubleshooting

### 404 Error on Reports Table
- Make sure you ran the SQL migration in Step 1
- Check that the table name is exactly `reports` (lowercase)

### Storage Upload Errors
- Verify the bucket name is exactly `report-photos`
- Check that the bucket is set to **Public**
- Make sure storage policies are set up correctly

### Permission Errors
- Check that Row Level Security (RLS) policies are created
- Verify your user is authenticated

