# Next.js + Supabase + Storj Comic Sharing Website

This extended boilerplate provides a complete foundation for building a comic sharing website with advanced user dashboard features. It integrates Next.js for the frontend, Supabase for database and authentication, and Storj for S3-compatible image storage.

## Features

### Core Features
- **User Authentication**
  - Email/password sign up and sign in
  - User profiles with avatars
  - Protected routes for authenticated users
  - Role-based access (admin vs regular users)

- **Comic Management**
  - Comic listing with cover images
  - Detailed comic pages with metadata
  - Chapter organization
  - Genre tagging and filtering
  - Reading progress tracking

- **Reading Experience**
  - Page-by-page comic reader
  - Zoom and fullscreen controls
  - Premium content support
  - Progress saving

- **Bookmarking System**
  - Custom bookmark folders (up to 100)
  - Add/remove bookmarks
  - Organize comics by folder
  - Drag-and-drop folder organization

- **Search & Discovery**
  - Comic search functionality
  - Recommendations
  - Latest comics feed
  - Genre-based browsing

### Extended Dashboard Features

- **User Dashboard**
  - Centralized dashboard after login
  - User statistics and activity overview
  - Quick access to all features
  - Responsive design for all devices

- **Settings Management**
  - Password change functionality
  - Profile information editing
  - Avatar upload and management
  - Theme preferences (light/dark/system)
  - Notification settings

- **Enhanced Bookmark Management**
  - Support for up to 100 folders
  - Custom folder colors and icons
  - Drag-and-drop organization
  - Folder statistics

- **Comic Upload System**
  - Cover image upload
  - Multi-page comic upload (up to 100 pages)
  - Drag-and-drop page reordering
  - Metadata entry (title, artist, tags, language)
  - Upload progress tracking

- **Comic Management Dashboard**
  - View all uploaded comics
  - Pagination for large collections
  - Edit existing comics
  - Delete with confirmation
  - Status indicators (published, draft, archived)

## Tech Stack

- **Frontend**: Next.js 13+ with App Router, TypeScript, Tailwind CSS
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Storj S3-compatible storage
- **Styling**: Tailwind CSS with dark mode support

## Getting Started

### Prerequisites

- Node.js 16.8+ and npm
- Supabase account (free tier works for development)
- Storj account for S3-compatible storage

### Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd nextjs-supabase-storj
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase and Storj credentials

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
STORJ_ENDPOINT=your-storj-endpoint
STORJ_ACCESS_KEY=your-storj-access-key
STORJ_SECRET_KEY=your-storj-secret-key
STORJ_BUCKET=your-storj-bucket-name
```

4. Set up the database:
   - Use the SQL scripts in the `database` folder to create tables and functions
   - Or import the provided Supabase schema

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
nextjs-supabase-storj/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Homepage
│   │   ├── layout.tsx          # Root layout
│   │   ├── dashboard/          # Dashboard pages
│   │   │   ├── page.tsx        # Dashboard home
│   │   │   ├── bookmarks/      # Bookmark management
│   │   │   ├── comics/         # Comic management
│   │   │   │   ├── page.tsx    # Comics listing
│   │   │   │   └── upload/     # Comic upload
│   │   │   └── settings/       # User settings
│   │   ├── comic/[slug]/       # Comic detail pages
│   │   ├── search/             # Search results page
│   │   └── ...                 # Other pages
│   ├── components/             # React components
│   │   ├── auth/               # Authentication components
│   │   ├── bookmarks/          # Bookmark components
│   │   ├── comics/             # Comic-related components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── layout/             # Layout components
│   │   ├── reader/             # Comic reader components
│   │   └── ui/                 # Reusable UI components
│   ├── context/                # React context providers
│   │   └── auth.tsx            # Authentication context
│   ├── lib/                    # Utility functions and libraries
│   │   ├── supabase/           # Supabase client and helpers
│   │   └── storage.ts          # Storj storage utilities
│   └── middleware.ts           # Next.js middleware for auth protection
├── public/                     # Static assets
├── database/                   # Database setup scripts
│   └── schema.sql              # SQL schema for Supabase
├── .env.local.example          # Example environment variables
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Project dependencies
```

## Database Schema

The boilerplate includes a complete database schema with the following tables:

- `profiles`: User profiles linked to Supabase Auth
- `comics`: Comic metadata
- `genres`: Genre categories
- `comic_genres`: Junction table for comics and genres
- `chapters`: Comic chapters
- `pages`: Comic pages
- `user_comics`: User-uploaded comics
- `comic_pages`: Pages for user-uploaded comics
- `comic_tags`: Available tags for comics
- `user_comic_tags`: Junction table for user comics and tags
- `bookmark_folders`: User bookmark folders (up to 100 per user)
- `bookmarks`: User bookmarks
- `reading_progress`: User reading progress
- `comments`: User comments
- `transactions`: Credit transactions
- `credit_packages`: Available credit packages

See the `database/schema.sql` file for the complete schema definition.

## Storage Structure

The Storj bucket is organized as follows:

- `covers/`: Comic cover images
- `pages/`: Comic page images organized by comic ID and chapter ID
- `user-comics/`: User-uploaded comic content
  - `{user_id}/covers/`: User comic cover images
  - `{user_id}/pages/{comic_id}/`: User comic page images
- `avatars/`: User avatar images
- `ads/`: Advertisement images

## Authentication

The boilerplate uses Supabase Auth for authentication. The `AuthProvider` context in `src/context/auth.tsx` provides authentication state and methods throughout the application.

Protected routes are handled by the Next.js middleware in `src/middleware.ts`.

## Dashboard Features

### User Dashboard

The dashboard serves as the central hub for users after authentication, providing:

- Overview of user activity and statistics
- Quick access to key features
- Recent activity feed
- Navigation to all user-specific sections

### Settings Management

The settings section allows users to:

- Change their password
- Edit profile information
- Upload and manage avatars
- Set theme preferences
- Configure notification settings

### Bookmark Management

The enhanced bookmark system supports:

- Up to 100 custom folders per user
- Folder customization with colors and icons
- Drag-and-drop organization
- Folder statistics and management

### Comic Upload

The comic upload system provides:

- Multi-step wizard interface
- Cover image upload
- Comic pages upload (up to 100 pages)
- Drag-and-drop page reordering
- Metadata form for title, artist, tags, and language
- Preview functionality

### Comic Management

The comic management dashboard offers:

- Grid view of all user-uploaded comics
- Pagination for large collections
- Status indicators for comics
- Edit and delete functionality
- View statistics for each comic

## Customization

### Styling

The project uses Tailwind CSS for styling. You can customize the theme in `tailwind.config.js`.

### Adding New Features

The modular structure makes it easy to add new features:

1. Add new database tables to the schema if needed
2. Create new components in the appropriate folders
3. Add new pages in the `src/app` directory
4. Update the navigation and routes as needed

## Deployment

### Deploying to Vercel

1. Push your code to a Git repository
2. Import the project in Vercel
3. Set up the environment variables
4. Deploy

### Other Hosting Options

The project can be built for production using:

```bash
npm run build
```

Then deploy the `.next` folder to your hosting provider of choice.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Storj](https://www.storj.io/)
- [Tailwind CSS](https://tailwindcss.com/)
