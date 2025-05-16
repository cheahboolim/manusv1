# Extended Database and Storage Schema

This document outlines the updates to the database and storage schema to support the new dashboard features, including enhanced bookmark management, comic uploads, and user settings.

## Database Schema Updates

### User Uploads and Comics Management

#### `user_comics` Table
```sql
CREATE TABLE user_comics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  artist TEXT NOT NULL,
  cover_image_url TEXT NOT NULL,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  language TEXT NOT NULL CHECK (language IN ('English', 'Chinese', 'Japanese', 'Other')),
  page_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

CREATE INDEX user_comics_user_id_idx ON user_comics(user_id);
CREATE INDEX user_comics_slug_idx ON user_comics(slug);
CREATE INDEX user_comics_created_at_idx ON user_comics(created_at DESC);
```

#### `comic_pages` Table
```sql
CREATE TABLE comic_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comic_id UUID REFERENCES user_comics(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (comic_id, page_number)
);

CREATE INDEX comic_pages_comic_id_idx ON comic_pages(comic_id);
```

#### `comic_tags` Table
```sql
CREATE TABLE comic_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#000000'
);

-- Insert default tags
INSERT INTO comic_tags (name, slug, color) VALUES
  ('Action', 'action', '#e74c3c'),
  ('Adventure', 'adventure', '#3498db'),
  ('Comedy', 'comedy', '#1abc9c'),
  ('Drama', 'drama', '#f39c12'),
  ('Fantasy', 'fantasy', '#9b59b6'),
  ('Horror', 'horror', '#2d3436'),
  ('Mystery', 'mystery', '#6c5ce7'),
  ('Romance', 'romance', '#e84393'),
  ('Sci-Fi', 'sci-fi', '#00cec9'),
  ('Slice of Life', 'slice-of-life', '#fd79a8'),
  ('Sports', 'sports', '#2ecc71'),
  ('Supernatural', 'supernatural', '#636e72');
```

#### `user_comic_tags` Junction Table
```sql
CREATE TABLE user_comic_tags (
  comic_id UUID REFERENCES user_comics(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES comic_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (comic_id, tag_id)
);

CREATE INDEX user_comic_tags_comic_id_idx ON user_comic_tags(comic_id);
CREATE INDEX user_comic_tags_tag_id_idx ON user_comic_tags(tag_id);
```

### Enhanced Bookmark Management

#### Updated `bookmark_folders` Table
```sql
-- Add folder limit constraint
ALTER TABLE profiles ADD COLUMN max_bookmark_folders INTEGER DEFAULT 100;

-- Add folder order for sorting
ALTER TABLE bookmark_folders ADD COLUMN display_order INTEGER DEFAULT 0;
ALTER TABLE bookmark_folders ADD COLUMN color TEXT DEFAULT '#3498db';
ALTER TABLE bookmark_folders ADD COLUMN icon TEXT DEFAULT 'folder';

-- Add unique constraint to prevent exceeding folder limit
CREATE OR REPLACE FUNCTION check_folder_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM bookmark_folders WHERE user_id = NEW.user_id) > 
     (SELECT max_bookmark_folders FROM profiles WHERE id = NEW.user_id) THEN
    RAISE EXCEPTION 'Maximum folder limit reached';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_folder_limit
BEFORE INSERT ON bookmark_folders
FOR EACH ROW EXECUTE FUNCTION check_folder_limit();
```

#### Updated `bookmarks` Table
```sql
-- Add display order for sorting within folders
ALTER TABLE bookmarks ADD COLUMN display_order INTEGER DEFAULT 0;

-- Add notes field for user annotations
ALTER TABLE bookmarks ADD COLUMN notes TEXT;

-- Create index for efficient sorting
CREATE INDEX bookmarks_folder_order_idx ON bookmarks(folder_id, display_order);
```

### User Settings

#### Updated `profiles` Table
```sql
-- Add additional profile fields
ALTER TABLE profiles ADD COLUMN theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system'));
ALTER TABLE profiles ADD COLUMN notification_preferences JSONB DEFAULT '{"email": true, "site": true}';
ALTER TABLE profiles ADD COLUMN last_password_change TIMESTAMP WITH TIME ZONE;
```

## Row Level Security Policies

### User Comics Table
```sql
-- Users can only see their own comics or published comics
ALTER TABLE user_comics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own comics"
  ON user_comics FOR SELECT
  USING (auth.uid() = user_id OR status = 'published');

CREATE POLICY "Users can insert their own comics"
  ON user_comics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comics"
  ON user_comics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comics"
  ON user_comics FOR DELETE
  USING (auth.uid() = user_id);
```

### Comic Pages Table
```sql
-- Users can only manage pages for their own comics
ALTER TABLE comic_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published comic pages"
  ON comic_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_comics
      WHERE user_comics.id = comic_id
      AND (user_comics.status = 'published' OR user_comics.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert pages for their own comics"
  ON comic_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_comics
      WHERE user_comics.id = comic_id AND user_comics.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pages for their own comics"
  ON comic_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_comics
      WHERE user_comics.id = comic_id AND user_comics.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pages for their own comics"
  ON comic_pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_comics
      WHERE user_comics.id = comic_id AND user_comics.user_id = auth.uid()
    )
  );
```

## Storj Storage Structure Updates

### Updated Bucket: `comic-sharing`

#### Extended Folder Structure

```
comic-sharing/
├── covers/
│   ├── {comic_id}.jpg  # Official comics covers
│   └── ...
├── user-comics/
│   ├── {user_id}/
│   │   ├── covers/
│   │   │   ├── {comic_id}.jpg  # User uploaded comic covers
│   │   │   └── ...
│   │   └── pages/
│   │       ├── {comic_id}/
│   │       │   ├── {page_number}.jpg  # User uploaded comic pages
│   │       │   └── ...
│   │       └── ...
│   └── ...
├── pages/
│   ├── {comic_id}/  # Official comics pages
│   │   ├── {chapter_id}/
│   │   │   ├── {page_number}.jpg
│   │   │   └── ...
│   │   └── ...
│   └── ...
├── avatars/
│   ├── {user_id}.jpg
│   └── ...
└── ads/
    ├── top/
    │   ├── ad1.jpg
    │   └── ...
    ├── sidebar/
    │   ├── ad1.jpg
    │   └── ...
    └── bottom/
        ├── ad1.jpg
        └── ...
```

### Access Control Updates

- Public read access for published user comic covers and pages
- Private read/write access for draft user comics
- User-specific write access for their own comic content
- Admin-only write access for official comic content and ad content

### File Naming Conventions

1. User Comic Covers:
   - Format: `user-comics/{user_id}/covers/{comic_id}.jpg`
   - Example: `user-comics/f47ac10b-58cc-4372-a567-0e02b2c3d479/covers/550e8400-e29b-41d4-a716-446655440000.jpg`

2. User Comic Pages:
   - Format: `user-comics/{user_id}/pages/{comic_id}/{page_number}.jpg`
   - Example: `user-comics/f47ac10b-58cc-4372-a567-0e02b2c3d479/pages/550e8400-e29b-41d4-a716-446655440000/001.jpg`

## Database Functions and Stored Procedures

### Reorder Comic Pages
```sql
CREATE OR REPLACE FUNCTION reorder_comic_pages(comic_uuid UUID, page_order JSON)
RETURNS void AS $$
DECLARE
  page_id UUID;
  new_order INTEGER;
BEGIN
  FOR i IN 0..json_array_length(page_order) - 1 LOOP
    page_id := json_array_element_text(page_order, i)::UUID;
    new_order := i + 1;
    
    UPDATE comic_pages
    SET page_number = new_order
    WHERE id = page_id AND comic_id = comic_uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### Get User Comic Stats
```sql
CREATE OR REPLACE FUNCTION get_user_comic_stats(user_uuid UUID)
RETURNS TABLE (
  total_comics INTEGER,
  total_pages INTEGER,
  total_views INTEGER,
  total_bookmarks INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT uc.id)::INTEGER AS total_comics,
    COALESCE(SUM(uc.page_count), 0)::INTEGER AS total_pages,
    COALESCE(SUM(uc.view_count), 0)::INTEGER AS total_views,
    COUNT(DISTINCT b.id)::INTEGER AS total_bookmarks
  FROM user_comics uc
  LEFT JOIN bookmarks b ON uc.id = b.comic_id
  WHERE uc.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;
```

### Get User Bookmark Stats
```sql
CREATE OR REPLACE FUNCTION get_user_bookmark_stats(user_uuid UUID)
RETURNS TABLE (
  total_folders INTEGER,
  total_bookmarks INTEGER,
  folders_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT bf.id)::INTEGER AS total_folders,
    COUNT(DISTINCT b.id)::INTEGER AS total_bookmarks,
    (p.max_bookmark_folders - COUNT(DISTINCT bf.id))::INTEGER AS folders_remaining
  FROM profiles p
  LEFT JOIN bookmark_folders bf ON p.id = bf.user_id
  LEFT JOIN bookmarks b ON bf.id = b.folder_id
  WHERE p.id = user_uuid
  GROUP BY p.max_bookmark_folders;
END;
$$ LANGUAGE plpgsql;
```

## API Functions and TypeScript Types

### TypeScript Types for User Comics

```typescript
export type UserComic = {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description?: string;
  artist: string;
  cover_image_url: string;
  status: 'draft' | 'published' | 'archived';
  language: 'English' | 'Chinese' | 'Japanese' | 'Other';
  page_count: number;
  created_at: string;
  updated_at: string;
  view_count: number;
  tags?: ComicTag[];
};

export type ComicPage = {
  id: string;
  comic_id: string;
  page_number: number;
  image_url: string;
  created_at: string;
};

export type ComicTag = {
  id: string;
  name: string;
  slug: string;
  color: string;
};

export type BookmarkFolder = {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  display_order: number;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
};
```

### Database Helper Functions

```typescript
// User Comics
export async function getUserComics(userId: string, page = 1, limit = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data, error, count } = await supabase
    .from('user_comics')
    .select('*, user_comic_tags(comic_tags(*))', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  
  return { comics: data, error, count };
}

export async function createUserComic(comic: Omit<UserComic, 'id' | 'created_at' | 'updated_at' | 'view_count'>) {
  const { data, error } = await supabase
    .from('user_comics')
    .insert(comic)
    .select()
    .single();
  
  return { comic: data as UserComic | null, error };
}

export async function updateUserComic(comicId: string, updates: Partial<UserComic>) {
  const { data, error } = await supabase
    .from('user_comics')
    .update(updates)
    .eq('id', comicId)
    .select()
    .single();
  
  return { comic: data as UserComic | null, error };
}

// Comic Pages
export async function addComicPage(page: Omit<ComicPage, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('comic_pages')
    .insert(page)
    .select()
    .single();
  
  return { page: data as ComicPage | null, error };
}

export async function reorderComicPages(comicId: string, pageOrder: string[]) {
  const { error } = await supabase
    .rpc('reorder_comic_pages', { 
      comic_uuid: comicId, 
      page_order: JSON.stringify(pageOrder) 
    });
  
  return { error };
}

// Bookmark Folders
export async function createBookmarkFolder(folder: Omit<BookmarkFolder, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('bookmark_folders')
    .insert(folder)
    .select()
    .single();
  
  return { folder: data as BookmarkFolder | null, error };
}

// User Stats
export async function getUserComicStats(userId: string) {
  const { data, error } = await supabase
    .rpc('get_user_comic_stats', { user_uuid: userId });
  
  return { stats: data, error };
}

export async function getUserBookmarkStats(userId: string) {
  const { data, error } = await supabase
    .rpc('get_user_bookmark_stats', { user_uuid: userId });
  
  return { stats: data, error };
}
```

## Storage Integration

### Storj Helper Functions

```typescript
// Upload comic cover image
export async function uploadComicCover(userId: string, comicId: string, file: File) {
  const fileExt = file.name.split('.').pop();
  const filePath = `user-comics/${userId}/covers/${comicId}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('comic-sharing')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });
  
  if (error) {
    return { url: null, error };
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('comic-sharing')
    .getPublicUrl(filePath);
  
  return { url: publicUrl, error: null };
}

// Upload comic page
export async function uploadComicPage(userId: string, comicId: string, pageNumber: number, file: File) {
  const fileExt = file.name.split('.').pop();
  const filePath = `user-comics/${userId}/pages/${comicId}/${pageNumber.toString().padStart(3, '0')}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('comic-sharing')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });
  
  if (error) {
    return { url: null, error };
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('comic-sharing')
    .getPublicUrl(filePath);
  
  return { url: publicUrl, error: null };
}

// Delete comic and all associated files
export async function deleteUserComic(userId: string, comicId: string) {
  // Delete cover image
  await supabase.storage
    .from('comic-sharing')
    .remove([`user-comics/${userId}/covers/${comicId}.jpg`]);
  
  // Delete all pages
  const { data } = await supabase.storage
    .from('comic-sharing')
    .list(`user-comics/${userId}/pages/${comicId}`);
  
  if (data && data.length > 0) {
    const filesToDelete = data.map(file => `user-comics/${userId}/pages/${comicId}/${file.name}`);
    await supabase.storage
      .from('comic-sharing')
      .remove(filesToDelete);
  }
  
  // Delete comic from database
  const { error } = await supabase
    .from('user_comics')
    .delete()
    .eq('id', comicId);
  
  return { error };
}
```

## Migration and Seeding

### Migration Script

```sql
-- Run this script to update the existing database schema

-- 1. Add new tables
-- user_comics table
CREATE TABLE IF NOT EXISTS user_comics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  artist TEXT NOT NULL,
  cover_image_url TEXT NOT NULL,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  language TEXT NOT NULL CHECK (language IN ('English', 'Chinese', 'Japanese', 'Other')),
  page_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

-- comic_pages table
CREATE TABLE IF NOT EXISTS comic_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comic_id UUID REFERENCES user_comics(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (comic_id, page_number)
);

-- comic_tags table
CREATE TABLE IF NOT EXISTS comic_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#000000'
);

-- user_comic_tags junction table
CREATE TABLE IF NOT EXISTS user_comic_tags (
  comic_id UUID REFERENCES user_comics(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES comic_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (comic_id, tag_id)
);

-- 2. Update existing tables
-- Update profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS max_bookmark_folders INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "site": true}',
  ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP WITH TIME ZONE;

-- Update bookmark_folders table
ALTER TABLE bookmark_folders
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3498db',
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'folder';

-- Update bookmarks table
ALTER TABLE bookmarks
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS user_comics_user_id_idx ON user_comics(user_id);
CREATE INDEX IF NOT EXISTS user_comics_slug_idx ON user_comics(slug);
CREATE INDEX IF NOT EXISTS user_comics_created_at_idx ON user_comics(created_at DESC);
CREATE INDEX IF NOT EXISTS comic_pages_comic_id_idx ON comic_pages(comic_id);
CREATE INDEX IF NOT EXISTS user_comic_tags_comic_id_idx ON user_comic_tags(comic_id);
CREATE INDEX IF NOT EXISTS user_comic_tags_tag_id_idx ON user_comic_tags(tag_id);
CREATE INDEX IF NOT EXISTS bookmarks_folder_order_idx ON bookmarks(folder_id, display_order);

-- 4. Create functions and triggers
-- Folder limit check function
CREATE OR REPLACE FUNCTION check_folder_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM bookmark_folders WHERE user_id = NEW.user_id) > 
     (SELECT max_bookmark_folders FROM profiles WHERE id = NEW.user_id) THEN
    RAISE EXCEPTION 'Maximum folder limit reached';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'enforce_folder_limit'
  ) THEN
    CREATE TRIGGER enforce_folder_limit
    BEFORE INSERT ON bookmark_folders
    FOR EACH ROW EXECUTE FUNCTION check_folder_limit();
  END IF;
END
$$;

-- 5. Create RLS policies
-- Enable RLS on new tables
ALTER TABLE user_comics ENABLE ROW LEVEL SECURITY;
ALTER TABLE comic_pages ENABLE ROW LEVEL SECURITY;

-- User comics policies
CREATE POLICY "Users can view their own comics"
  ON user_comics FOR SELECT
  USING (auth.uid() = user_id OR status = 'published');

CREATE POLICY "Users can insert their own comics"
  ON user_comics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comics"
  ON user_comics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comics"
  ON user_comics FOR DELETE
  USING (auth.uid() = user_id);

-- Comic pages policies
CREATE POLICY "Anyone can view published comic pages"
  ON comic_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_comics
      WHERE user_comics.id = comic_id
      AND (user_comics.status = 'published' OR user_comics.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert pages for their own comics"
  ON comic_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_comics
      WHERE user_comics.id = comic_id AND user_comics.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pages for their own comics"
  ON comic_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_comics
      WHERE user_comics.id = comic_id AND user_comics.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pages for their own comics"
  ON comic_pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_comics
      WHERE user_comics.id = comic_id AND user_comics.user_id = auth.uid()
    )
  );

-- 6. Insert default tags
INSERT INTO comic_tags (name, slug, color)
VALUES
  ('Action', 'action', '#e74c3c'),
  ('Adventure', 'adventure', '#3498db'),
  ('Comedy', 'comedy', '#1abc9c'),
  ('Drama', 'drama', '#f39c12'),
  ('Fantasy', 'fantasy', '#9b59b6'),
  ('Horror', 'horror', '#2d3436'),
  ('Mystery', 'mystery', '#6c5ce7'),
  ('Romance', 'romance', '#e84393'),
  ('Sci-Fi', 'sci-fi', '#00cec9'),
  ('Slice of Life', 'slice-of-life', '#fd79a8'),
  ('Sports', 'sports', '#2ecc71'),
  ('Supernatural', 'supernatural', '#636e72')
ON CONFLICT (name) DO NOTHING;

-- 7. Create stored procedures
-- Reorder comic pages function
CREATE OR REPLACE FUNCTION reorder_comic_pages(comic_uuid UUID, page_order JSON)
RETURNS void AS $$
DECLARE
  page_id UUID;
  new_order INTEGER;
BEGIN
  FOR i IN 0..json_array_length(page_order) - 1 LOOP
    page_id := json_array_element_text(page_order, i)::UUID;
    new_order := i + 1;
    
    UPDATE comic_pages
    SET page_number = new_order
    WHERE id = page_id AND comic_id = comic_uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Get user comic stats function
CREATE OR REPLACE FUNCTION get_user_comic_stats(user_uuid UUID)
RETURNS TABLE (
  total_comics INTEGER,
  total_pages INTEGER,
  total_views INTEGER,
  total_bookmarks INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT uc.id)::INTEGER AS total_comics,
    COALESCE(SUM(uc.page_count), 0)::INTEGER AS total_pages,
    COALESCE(SUM(uc.view_count), 0)::INTEGER AS total_views,
    COUNT(DISTINCT b.id)::INTEGER AS total_bookmarks
  FROM user_comics uc
  LEFT JOIN bookmarks b ON uc.id = b.comic_id
  WHERE uc.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Get user bookmark stats function
CREATE OR REPLACE FUNCTION get_user_bookmark_stats(user_uuid UUID)
RETURNS TABLE (
  total_folders INTEGER,
  total_bookmarks INTEGER,
  folders_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT bf.id)::INTEGER AS total_folders,
    COUNT(DISTINCT b.id)::INTEGER AS total_bookmarks,
    (p.max_bookmark_folders - COUNT(DISTINCT bf.id))::INTEGER AS folders_remaining
  FROM profiles p
  LEFT JOIN bookmark_folders bf ON p.id = bf.user_id
  LEFT JOIN bookmarks b ON bf.id = b.folder_id
  WHERE p.id = user_uuid
  GROUP BY p.max_bookmark_folders;
END;
$$ LANGUAGE plpgsql;
```
