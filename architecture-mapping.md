# Feature Mapping to Boilerplate Architecture

This document maps the features identified in the comic sharing website to our Next.js, Supabase, and Storj boilerplate architecture.

## 1. Navigation & Layout

### Next.js Components
- `src/components/layout/Navbar.tsx`: Main navigation bar with logo, links, search, and auth buttons
- `src/components/layout/Layout.tsx`: Main layout wrapper with header, footer, and content area
- `src/components/ui/ThemeToggle.tsx`: Theme toggle button component
- `src/app/layout.tsx`: Root layout with theme provider

### Supabase Integration
- User session state for conditional rendering of auth links

### Storj Integration
- Not directly required for navigation components

## 2. Comic Listing & Discovery

### Next.js Components
- `src/app/page.tsx`: Homepage with recommended and latest comics sections
- `src/components/comics/ComicCard.tsx`: Reusable comic card component
- `src/components/comics/ComicGrid.tsx`: Grid layout for comic cards
- `src/components/sections/RecommendedComics.tsx`: Section component for recommended comics
- `src/components/sections/LatestComics.tsx`: Section component for latest comics

### Supabase Integration
- Database queries for fetching comics data
- Real-time subscription for latest comics updates
- User preferences for recommended comics

### Storj Integration
- Storage for comic cover images
- Image optimization and caching

## 3. Comic Details Page

### Next.js Components
- `src/app/comic/[slug]/page.tsx`: Comic detail page
- `src/components/comics/ComicHeader.tsx`: Comic title, author, and metadata
- `src/components/comics/GenreTags.tsx`: Genre tag pills component
- `src/components/comics/ComicPreview.tsx`: Preview images component
- `src/components/comics/CommentSection.tsx`: Comments section component
- `src/components/ui/Button.tsx`: Reusable button component for actions

### Supabase Integration
- Comic metadata stored in `comics` table
- Genres stored in `genres` table with many-to-many relationship
- Comments stored in `comments` table
- User interactions (bookmarks, reading progress) in respective tables

### Storj Integration
- Comic cover images
- Preview panel images
- Chapter page images

## 4. User Authentication

### Next.js Components
- `src/app/sign-in/page.tsx`: Sign in page
- `src/app/sign-up/page.tsx`: Sign up page
- `src/components/auth/SignInForm.tsx`: Sign in form component
- `src/components/auth/SignUpForm.tsx`: Sign up form component
- `src/components/auth/ForgotPassword.tsx`: Forgot password component

### Supabase Integration
- Authentication using Supabase Auth
- User profiles in `profiles` table
- Role-based access control (admin vs regular users)

### Storj Integration
- User avatar images

## 5. Bookmarks & Collections

### Next.js Components
- `src/app/bookmarks/page.tsx`: Bookmarks page
- `src/components/bookmarks/BookmarkFolders.tsx`: Folder navigation component
- `src/components/bookmarks/NewFolderButton.tsx`: New folder creation button
- `src/components/bookmarks/BookmarkedComics.tsx`: Grid of bookmarked comics

### Supabase Integration
- `bookmark_folders` table for user-created folders
- `bookmarks` table for comic bookmarks with folder relationships
- Real-time updates when bookmarks change

### Storj Integration
- Not directly required for bookmarks functionality

## 6. Search Functionality

### Next.js Components
- `src/components/search/SearchBar.tsx`: Search input component
- `src/app/search/page.tsx`: Search results page
- `src/components/search/SearchResults.tsx`: Search results component

### Supabase Integration
- Full-text search on comics table
- Search history tracking (optional)

### Storj Integration
- Not directly required for search functionality

## 7. Monetization

### Next.js Components
- `src/components/ads/AdBanner.tsx`: Reusable ad banner component
- `src/components/payments/PurchaseCredits.tsx`: Credits purchase component

### Supabase Integration
- `user_credits` table for tracking user credits
- `transactions` table for purchase history

### Storj Integration
- Ad banner images

## Database Schema (Supabase)

### Tables
1. `profiles`
   - id (references auth.users)
   - username
   - avatar_url
   - created_at
   - updated_at
   - role (user, admin)

2. `comics`
   - id
   - title
   - slug
   - author_id (references profiles)
   - description
   - cover_image_url
   - published_at
   - created_at
   - updated_at

3. `genres`
   - id
   - name
   - slug
   - color

4. `comic_genres` (junction table)
   - comic_id
   - genre_id

5. `chapters`
   - id
   - comic_id
   - title
   - number
   - published_at
   - is_premium
   - credit_cost

6. `pages`
   - id
   - chapter_id
   - page_number
   - image_url

7. `bookmark_folders`
   - id
   - user_id
   - name
   - is_default
   - created_at

8. `bookmarks`
   - id
   - user_id
   - comic_id
   - folder_id
   - created_at

9. `reading_progress`
   - user_id
   - comic_id
   - chapter_id
   - page_id
   - last_read_at

10. `comments`
    - id
    - user_id
    - comic_id
    - chapter_id (optional)
    - content
    - created_at
    - updated_at

11. `user_credits`
    - user_id
    - balance
    - updated_at

12. `transactions`
    - id
    - user_id
    - amount
    - type (purchase, spend)
    - description
    - created_at

## Storage Structure (Storj)

### Buckets and Folders
1. `comic-covers/`
   - `{comic_id}.jpg`

2. `comic-pages/`
   - `{comic_id}/`
     - `{chapter_id}/`
       - `{page_number}.jpg`

3. `user-avatars/`
   - `{user_id}.jpg`

4. `ad-banners/`
   - `top/`
   - `sidebar/`
   - `bottom/`

## API Routes

1. `/api/comics`
   - GET: List comics with filtering and pagination
   - POST: Create new comic (admin only)

2. `/api/comics/[slug]`
   - GET: Get comic details
   - PUT: Update comic (admin only)
   - DELETE: Delete comic (admin only)

3. `/api/comics/[slug]/chapters`
   - GET: List chapters for a comic
   - POST: Add new chapter (admin only)

4. `/api/chapters/[id]`
   - GET: Get chapter details with pages
   - PUT: Update chapter (admin only)
   - DELETE: Delete chapter (admin only)

5. `/api/bookmarks`
   - GET: Get user's bookmarks
   - POST: Add bookmark
   - DELETE: Remove bookmark

6. `/api/bookmark-folders`
   - GET: List user's bookmark folders
   - POST: Create new folder
   - PUT: Update folder
   - DELETE: Delete folder

7. `/api/comments`
   - GET: Get comments for a comic/chapter
   - POST: Add comment
   - PUT: Edit comment
   - DELETE: Delete comment

8. `/api/search`
   - GET: Search comics by title, author, genre

9. `/api/credits`
   - GET: Get user's credit balance
   - POST: Purchase credits
   - PUT: Spend credits

## Authentication Flows

1. Sign Up
   - User enters name, email, password
   - Supabase creates auth user
   - Trigger creates profile record
   - Redirect to homepage or onboarding

2. Sign In
   - User enters email, password
   - Supabase authenticates
   - Session stored in context
   - Redirect to previous page or homepage

3. Sign Out
   - Clear Supabase session
   - Redirect to homepage

4. Password Reset
   - User enters email
   - Supabase sends reset email
   - User clicks link and enters new password

## Admin Functionality

1. Comic Management
   - Create, edit, delete comics
   - Manage chapters and pages
   - Upload images to Storj

2. User Management
   - View user list
   - Manage roles
   - Handle reports

3. Content Moderation
   - Review and moderate comments
   - Handle reported content

## Implementation Priorities

1. Core Infrastructure
   - Database schema setup
   - Storage buckets configuration
   - Authentication flows
   - Base UI components

2. Essential Features
   - Comic listing and details
   - User authentication
   - Basic navigation and layout

3. Enhanced Features
   - Bookmarks and collections
   - Search functionality
   - Comments

4. Advanced Features
   - Admin dashboard
   - Monetization
   - Reading progress tracking
