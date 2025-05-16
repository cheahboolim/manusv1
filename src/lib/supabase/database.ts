import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type Profile = {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  email: string;
  role: 'user' | 'admin';
  credits: number;
  created_at: string;
  updated_at: string;
};

export type Comic = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  author_id: string;
  cover_image_url?: string;
  status: 'ongoing' | 'completed' | 'hiatus';
  publication_date?: string;
  created_at: string;
  updated_at: string;
  view_count: number;
};

export type Genre = {
  id: string;
  name: string;
  slug: string;
  color: string;
};

export type Chapter = {
  id: string;
  comic_id: string;
  title: string;
  chapter_number: number;
  description?: string;
  is_premium: boolean;
  credit_cost: number;
  page_count: number;
  published_at: string;
  created_at: string;
  updated_at: string;
};

export type Page = {
  id: string;
  chapter_id: string;
  page_number: number;
  image_url: string;
  created_at: string;
};

export type BookmarkFolder = {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type Bookmark = {
  id: string;
  user_id: string;
  comic_id: string;
  folder_id: string;
  created_at: string;
};

export type ReadingProgress = {
  user_id: string;
  comic_id: string;
  chapter_id: string;
  page_number: number;
  last_read_at: string;
};

export type Comment = {
  id: string;
  user_id: string;
  comic_id: string;
  chapter_id?: string;
  parent_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: 'purchase' | 'spend';
  description?: string;
  created_at: string;
};

export type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Database helper functions

// Profiles
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { profile: data as Profile | null, error };
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  return { profile: data as Profile | null, error };
}

// Comics
export async function getComics(page = 1, limit = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data, error, count } = await supabase
    .from('comics')
    .select('*, profiles(username, display_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  
  return { comics: data, error, count };
}

export async function getComicBySlug(slug: string) {
  const { data, error } = await supabase
    .from('comics')
    .select(`
      *,
      profiles(username, display_name, avatar_url),
      comic_genres(genres(*))
    `)
    .eq('slug', slug)
    .single();
  
  return { comic: data, error };
}

export async function getLatestComics(limit = 5) {
  const { data, error } = await supabase
    .from('comics')
    .select('*, profiles(username, display_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return { comics: data, error };
}

export async function getPopularComics(limit = 5) {
  const { data, error } = await supabase
    .from('comics')
    .select('*, profiles(username, display_name)')
    .order('view_count', { ascending: false })
    .limit(limit);
  
  return { comics: data, error };
}

// Chapters
export async function getChapters(comicId: string) {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('comic_id', comicId)
    .order('chapter_number', { ascending: true });
  
  return { chapters: data as Chapter[] | null, error };
}

export async function getChapter(chapterId: string) {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .single();
  
  return { chapter: data as Chapter | null, error };
}

// Pages
export async function getPages(chapterId: string) {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('page_number', { ascending: true });
  
  return { pages: data as Page[] | null, error };
}

// Bookmarks
export async function getBookmarkFolders(userId: string) {
  const { data, error } = await supabase
    .from('bookmark_folders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  
  return { folders: data as BookmarkFolder[] | null, error };
}

export async function getBookmarks(userId: string, folderId: string) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      *,
      comics(*, profiles(username, display_name))
    `)
    .eq('user_id', userId)
    .eq('folder_id', folderId)
    .order('created_at', { ascending: false });
  
  return { bookmarks: data, error };
}

export async function addBookmark(userId: string, comicId: string, folderId: string) {
  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      user_id: userId,
      comic_id: comicId,
      folder_id: folderId
    })
    .select()
    .single();
  
  return { bookmark: data as Bookmark | null, error };
}

export async function removeBookmark(userId: string, comicId: string, folderId: string) {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('comic_id', comicId)
    .eq('folder_id', folderId);
  
  return { error };
}

// Reading Progress
export async function updateReadingProgress(
  userId: string, 
  comicId: string, 
  chapterId: string, 
  pageNumber: number
) {
  const { data, error } = await supabase
    .from('reading_progress')
    .upsert({
      user_id: userId,
      comic_id: comicId,
      chapter_id: chapterId,
      page_number: pageNumber,
      last_read_at: new Date().toISOString()
    })
    .select()
    .single();
  
  return { progress: data as ReadingProgress | null, error };
}

export async function getReadingProgress(userId: string, comicId: string) {
  const { data, error } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('comic_id', comicId)
    .single();
  
  return { progress: data as ReadingProgress | null, error };
}

export async function getUserReadingList(userId: string, limit = 10) {
  const { data, error } = await supabase
    .rpc('get_user_reading_list', { user_uuid: userId })
    .limit(limit);
  
  return { readingList: data, error };
}

// Comments
export async function getComments(comicId: string, chapterId?: string) {
  let query = supabase
    .from('comments')
    .select(`
      *,
      profiles(username, display_name, avatar_url)
    `)
    .eq('comic_id', comicId)
    .order('created_at', { ascending: false });
  
  if (chapterId) {
    query = query.eq('chapter_id', chapterId);
  }
  
  const { data, error } = await query;
  
  return { comments: data, error };
}

export async function addComment(
  userId: string, 
  comicId: string, 
  content: string, 
  chapterId?: string, 
  parentId?: string
) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      user_id: userId,
      comic_id: comicId,
      chapter_id: chapterId,
      parent_id: parentId,
      content
    })
    .select()
    .single();
  
  return { comment: data as Comment | null, error };
}

// Search
export async function searchComics(query: string, limit = 20) {
  const { data, error } = await supabase
    .from('comics')
    .select('*, profiles(username, display_name)')
    .textSearch('search_vector', query)
    .limit(limit);
  
  return { comics: data, error };
}

// Genres
export async function getGenres() {
  const { data, error } = await supabase
    .from('genres')
    .select('*')
    .order('name', { ascending: true });
  
  return { genres: data as Genre[] | null, error };
}

export async function getComicsByGenre(genreSlug: string, page = 1, limit = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data, error, count } = await supabase
    .from('comics')
    .select(`
      *,
      profiles(username, display_name),
      comic_genres!inner(genres!inner(*))
    `, { count: 'exact' })
    .eq('comic_genres.genres.slug', genreSlug)
    .range(from, to);
  
  return { comics: data, error, count };
}

// Credits and Transactions
export async function getCreditPackages() {
  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true)
    .order('credits', { ascending: true });
  
  return { packages: data as CreditPackage[] | null, error };
}

export async function getUserTransactions(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return { transactions: data as Transaction[] | null, error };
}

// Increment comic view count
export async function incrementComicViewCount(comicSlug: string) {
  const { error } = await supabase
    .rpc('increment_comic_view_count', { comic_slug: comicSlug });
  
  return { error };
}
