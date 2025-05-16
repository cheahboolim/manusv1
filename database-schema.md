# Database and Storage Schema for Comic Sharing Website

## Supabase Database Schema

### 1. Users and Authentication

#### `profiles` Table
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, email)
  VALUES (NEW.id, NEW.email, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();
```

### 2. Comics and Content

#### `comics` Table
```sql
CREATE TABLE comics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  cover_image_url TEXT,
  status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'hiatus')),
  publication_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

CREATE INDEX comics_author_id_idx ON comics(author_id);
CREATE INDEX comics_slug_idx ON comics(slug);
```

#### `genres` Table
```sql
CREATE TABLE genres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#000000'
);

-- Insert default genres
INSERT INTO genres (name, slug, color) VALUES
  ('Adventure', 'adventure', '#3498db'),
  ('Fantasy', 'fantasy', '#e74c3c'),
  ('Action', 'action', '#2ecc71'),
  ('Shounen', 'shounen', '#9b59b6'),
  ('Drama', 'drama', '#f39c12'),
  ('Comedy', 'comedy', '#1abc9c'),
  ('Romance', 'romance', '#e84393'),
  ('Sci-Fi', 'sci-fi', '#00cec9'),
  ('Horror', 'horror', '#2d3436'),
  ('Mystery', 'mystery', '#6c5ce7');
```

#### `comic_genres` Junction Table
```sql
CREATE TABLE comic_genres (
  comic_id UUID REFERENCES comics(id) ON DELETE CASCADE,
  genre_id UUID REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (comic_id, genre_id)
);

CREATE INDEX comic_genres_comic_id_idx ON comic_genres(comic_id);
CREATE INDEX comic_genres_genre_id_idx ON comic_genres(genre_id);
```

#### `chapters` Table
```sql
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comic_id UUID REFERENCES comics(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  chapter_number DECIMAL(8,2) NOT NULL,
  description TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  credit_cost INTEGER DEFAULT 0,
  page_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (comic_id, chapter_number)
);

CREATE INDEX chapters_comic_id_idx ON chapters(comic_id);
CREATE INDEX chapters_published_at_idx ON chapters(published_at);
```

#### `pages` Table
```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  page_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (chapter_id, page_number)
);

CREATE INDEX pages_chapter_id_idx ON pages(chapter_id);
```

### 3. User Interactions

#### `bookmark_folders` Table
```sql
CREATE TABLE bookmark_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE INDEX bookmark_folders_user_id_idx ON bookmark_folders(user_id);

-- Create default folders for new users
CREATE OR REPLACE FUNCTION create_default_bookmark_folders()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO bookmark_folders (user_id, name, is_default)
  VALUES 
    (NEW.id, 'All Bookmarks', TRUE),
    (NEW.id, 'Favorites', TRUE),
    (NEW.id, 'Reading Later', TRUE),
    (NEW.id, 'Completed', TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_bookmark_folders();
```

#### `bookmarks` Table
```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comic_id UUID REFERENCES comics(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES bookmark_folders(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, comic_id, folder_id)
);

CREATE INDEX bookmarks_user_id_idx ON bookmarks(user_id);
CREATE INDEX bookmarks_comic_id_idx ON bookmarks(comic_id);
CREATE INDEX bookmarks_folder_id_idx ON bookmarks(folder_id);
```

#### `reading_progress` Table
```sql
CREATE TABLE reading_progress (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  comic_id UUID REFERENCES comics(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  page_number INTEGER,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, comic_id)
);

CREATE INDEX reading_progress_user_id_idx ON reading_progress(user_id);
CREATE INDEX reading_progress_comic_id_idx ON reading_progress(comic_id);
```

#### `comments` Table
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comic_id UUID REFERENCES comics(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX comments_comic_id_idx ON comments(comic_id);
CREATE INDEX comments_chapter_id_idx ON comments(chapter_id);
CREATE INDEX comments_user_id_idx ON comments(user_id);
CREATE INDEX comments_parent_id_idx ON comments(parent_id);
```

### 4. Monetization

#### `transactions` Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'spend')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX transactions_user_id_idx ON transactions(user_id);
CREATE INDEX transactions_created_at_idx ON transactions(created_at);
```

#### `credit_packages` Table
```sql
CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default credit packages
INSERT INTO credit_packages (name, credits, price) VALUES
  ('Starter Pack', 100, 4.99),
  ('Standard Pack', 500, 19.99),
  ('Premium Pack', 1200, 39.99);
```

## Row Level Security Policies

### Profiles Table
```sql
-- Anyone can read profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Comics Table
```sql
-- Anyone can read comics
ALTER TABLE comics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comics are viewable by everyone"
  ON comics FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert comics"
  ON comics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update comics"
  ON comics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete comics"
  ON comics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
```

### Bookmarks Table
```sql
-- Users can only see their own bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);
```

## Storj Storage Structure

### Bucket: `comic-sharing`

#### Folder Structure

```
comic-sharing/
├── covers/
│   ├── {comic_id}.jpg
│   └── ...
├── pages/
│   ├── {comic_id}/
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

### Access Control

- Public read access for comic covers and pages
- Authenticated read/write access for user avatars
- Admin-only write access for all comic content
- Public read access for ad content
- Admin-only write access for ad content

### File Naming Conventions

1. Comic Covers:
   - Format: `{comic_id}.jpg`
   - Example: `550e8400-e29b-41d4-a716-446655440000.jpg`

2. Comic Pages:
   - Format: `{page_number}.jpg`
   - Example: `001.jpg`, `002.jpg`

3. User Avatars:
   - Format: `{user_id}.jpg`
   - Example: `f47ac10b-58cc-4372-a567-0e02b2c3d479.jpg`

4. Ad Images:
   - Format: `{ad_name}.jpg`
   - Example: `top_banner_1.jpg`

## Database Relationships Diagram

```
profiles
  ↑ (1:1)
auth.users
  ↓ (1:n)
comics ←→ genres (m:n via comic_genres)
  ↓ (1:n)
chapters
  ↓ (1:n)
pages

profiles
  ↓ (1:n)
bookmark_folders
  ↑ (1:n)
bookmarks
  ↑ (n:1)
comics

profiles
  ↓ (1:n)
reading_progress
  ↑ (n:1)
comics
  ↑ (n:1)
chapters

profiles
  ↓ (1:n)
comments
  ↑ (n:1)
comics
  ↑ (n:1)
chapters

profiles
  ↓ (1:n)
transactions
```

## API Functions and Stored Procedures

### Update Comic View Count
```sql
CREATE OR REPLACE FUNCTION increment_comic_view_count(comic_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE comics
  SET view_count = view_count + 1
  WHERE slug = comic_slug;
END;
$$ LANGUAGE plpgsql;
```

### Update User Credits
```sql
CREATE OR REPLACE FUNCTION update_user_credits(user_uuid UUID, amount INTEGER, transaction_type TEXT, description TEXT)
RETURNS void AS $$
BEGIN
  -- Update user credits
  UPDATE profiles
  SET credits = credits + amount
  WHERE id = user_uuid;
  
  -- Record transaction
  INSERT INTO transactions (user_id, amount, type, description)
  VALUES (user_uuid, amount, transaction_type, description);
END;
$$ LANGUAGE plpgsql;
```

### Get User Reading List
```sql
CREATE OR REPLACE FUNCTION get_user_reading_list(user_uuid UUID)
RETURNS TABLE (
  comic_id UUID,
  title TEXT,
  cover_image_url TEXT,
  chapter_id UUID,
  chapter_number DECIMAL,
  page_number INTEGER,
  last_read_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS comic_id,
    c.title,
    c.cover_image_url,
    rp.chapter_id,
    ch.chapter_number,
    rp.page_number,
    rp.last_read_at
  FROM reading_progress rp
  JOIN comics c ON rp.comic_id = c.id
  JOIN chapters ch ON rp.chapter_id = ch.id
  WHERE rp.user_id = user_uuid
  ORDER BY rp.last_read_at DESC;
END;
$$ LANGUAGE plpgsql;
```

## Database Indexes and Performance Considerations

1. **Composite Indexes for Common Queries**
```sql
-- For filtering comics by genre
CREATE INDEX idx_comic_genres_genre_comic ON comic_genres(genre_id, comic_id);

-- For sorting comics by view count and publication date
CREATE INDEX idx_comics_views_date ON comics(view_count DESC, publication_date DESC);

-- For user reading history
CREATE INDEX idx_reading_progress_user_date ON reading_progress(user_id, last_read_at DESC);
```

2. **Full-Text Search for Comics**
```sql
-- Create a search vector column
ALTER TABLE comics ADD COLUMN search_vector tsvector;

-- Create a function to update the search vector
CREATE OR REPLACE FUNCTION comics_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create a trigger to update the search vector
CREATE TRIGGER comics_search_vector_update
BEFORE INSERT OR UPDATE ON comics
FOR EACH ROW EXECUTE FUNCTION comics_search_vector_update();

-- Create a GIN index for the search vector
CREATE INDEX comics_search_idx ON comics USING GIN (search_vector);
```

3. **Pagination Optimization**
```sql
-- For efficient pagination of comics
CREATE INDEX idx_comics_created_id ON comics(created_at DESC, id);

-- For efficient pagination of chapters
CREATE INDEX idx_chapters_comic_number ON chapters(comic_id, chapter_number DESC);

-- For efficient pagination of comments
CREATE INDEX idx_comments_comic_created ON comments(comic_id, created_at DESC);
```

## Data Migration and Seeding

1. **Initial Genre Data**
```sql
INSERT INTO genres (name, slug, color) VALUES
  ('Adventure', 'adventure', '#3498db'),
  ('Fantasy', 'fantasy', '#e74c3c'),
  ('Action', 'action', '#2ecc71'),
  ('Shounen', 'shounen', '#9b59b6'),
  ('Drama', 'drama', '#f39c12'),
  ('Comedy', 'comedy', '#1abc9c'),
  ('Romance', 'romance', '#e84393'),
  ('Sci-Fi', 'sci-fi', '#00cec9'),
  ('Horror', 'horror', '#2d3436'),
  ('Mystery', 'mystery', '#6c5ce7');
```

2. **Sample Comics Data**
```sql
-- Create admin user first
INSERT INTO profiles (id, username, display_name, email, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin', 'Admin User', 'admin@example.com', 'admin');

-- Insert sample comics
INSERT INTO comics (title, slug, description, author_id, cover_image_url, status, publication_date)
VALUES
  ('One Piece', 'one-piece', 'Follow Monkey D. Luffy and his swashbuckling crew in their search for the ultimate treasure, the One Piece.', '00000000-0000-0000-0000-000000000000', 'covers/one-piece.jpg', 'ongoing', '1999-07-22'),
  ('Naruto', 'naruto', 'Follow the journey of Naruto Uzumaki, a young ninja seeking recognition and dreaming of becoming the Hokage, the leader of his village.', '00000000-0000-0000-0000-000000000000', 'covers/naruto.jpg', 'completed', '1999-09-21'),
  ('Attack on Titan', 'attack-on-titan', 'In a world where humanity lives within cities surrounded by enormous walls due to the Titans, gigantic humanoid creatures who devour humans seemingly without reason.', '00000000-0000-0000-0000-000000000000', 'covers/attack-on-titan.jpg', 'completed', '2009-09-09');

-- Link comics to genres
INSERT INTO comic_genres (comic_id, genre_id)
VALUES
  ((SELECT id FROM comics WHERE slug = 'one-piece'), (SELECT id FROM genres WHERE slug = 'adventure')),
  ((SELECT id FROM comics WHERE slug = 'one-piece'), (SELECT id FROM genres WHERE slug = 'action')),
  ((SELECT id FROM comics WHERE slug = 'one-piece'), (SELECT id FROM genres WHERE slug = 'fantasy')),
  ((SELECT id FROM comics WHERE slug = 'naruto'), (SELECT id FROM genres WHERE slug = 'action')),
  ((SELECT id FROM comics WHERE slug = 'naruto'), (SELECT id FROM genres WHERE slug = 'adventure')),
  ((SELECT id FROM comics WHERE slug = 'naruto'), (SELECT id FROM genres WHERE slug = 'fantasy')),
  ((SELECT id FROM comics WHERE slug = 'attack-on-titan'), (SELECT id FROM genres WHERE slug = 'action')),
  ((SELECT id FROM comics WHERE slug = 'attack-on-titan'), (SELECT id FROM genres WHERE slug = 'drama')),
  ((SELECT id FROM comics WHERE slug = 'attack-on-titan'), (SELECT id FROM genres WHERE slug = 'horror'));
```

## Backup and Recovery Strategy

1. **Regular Database Backups**
   - Daily full backups of the Supabase database
   - Hourly incremental backups for critical tables
   - 30-day retention policy

2. **Storage Redundancy**
   - Storj provides built-in redundancy and erasure coding
   - Regular synchronization of critical assets to a secondary storage provider

3. **Point-in-Time Recovery**
   - Enable Supabase's point-in-time recovery feature
   - Maintain transaction logs for at least 7 days

4. **Disaster Recovery Plan**
   - Document recovery procedures for database corruption
   - Establish RTO (Recovery Time Objective) and RPO (Recovery Point Objective)
   - Regular testing of recovery procedures
