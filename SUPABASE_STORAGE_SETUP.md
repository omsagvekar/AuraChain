# Supabase Storage Setup Guide

If images are showing as small icons instead of the actual images, you need to configure your Supabase storage bucket properly.

## Option 1: Make the Bucket Public (Recommended for Development)

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Find the `post-images` bucket
4. Click on the bucket to open its settings
5. Make sure the bucket is set to **Public**
   - If it's private, click the toggle to make it public
   - Or go to **Policies** and ensure there's a public read policy

## Option 2: Set Up Storage Policies (Recommended for Production)

If you want to keep the bucket private but allow authenticated users to view images:

1. Go to **Storage** → **Policies** for the `post-images` bucket
2. Create a new policy with the following:

**Policy Name:** `Allow public read access`
**Policy Definition:**
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'post-images' );
```

Or for authenticated users only:
```sql
CREATE POLICY "Authenticated users can view images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'post-images' AND auth.role() = 'authenticated' );
```

## Option 3: Verify Bucket Exists

Make sure the `post-images` bucket exists:

1. Go to **Storage** in Supabase Dashboard
2. If the bucket doesn't exist, create it:
   - Click **New bucket**
   - Name: `post-images`
   - Set to **Public** (for development) or **Private** (for production with policies)

## Troubleshooting

- **Images show as broken icons**: Check browser console for CORS errors or 403/404 errors
- **Images don't load**: Verify the `image_path` in your posts table matches the actual file path in storage
- **403 Forbidden**: The bucket is private and you need to set up policies or make it public
- **404 Not Found**: The file path is incorrect or the file wasn't uploaded successfully

## Current Implementation

The app now tries both:
1. **Public URLs** (if bucket is public) - faster, no authentication needed
2. **Signed URLs** (if bucket is private) - requires authentication, expires after 1 hour

If both fail, you'll see an error message indicating the image is unavailable.

