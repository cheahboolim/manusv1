import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ComicHeader, ComicDescription, ChapterList, ComicPreview, CommentSection } from '@/components/comics/ComicDetails';
import { AdBanner } from '@/components/layout/Layout';
import { getComicBySlug, getChapters, getComments, incrementComicViewCount } from '@/lib/supabase/database';
import { BookmarkManager } from '@/components/bookmarks/BookmarkComponents';
import { useAuth } from '@/context/auth';

export default function ComicDetailsPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { user, profile } = useAuth();
  
  const [comic, setComic] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkFolders, setBookmarkFolders] = useState<any[]>([]);
  
  useEffect(() => {
    async function fetchComicDetails() {
      if (!slug) return;
      
      try {
        setLoading(true);
        
        // Fetch comic details
        const { comic: comicData } = await getComicBySlug(slug as string);
        if (comicData) {
          setComic(comicData);
          
          // Increment view count
          await incrementComicViewCount(slug as string);
          
          // Fetch chapters
          const { chapters: chaptersData } = await getChapters(comicData.id);
          if (chaptersData) {
            setChapters(chaptersData.map(chapter => ({
              id: chapter.id,
              title: chapter.title,
              chapterNumber: chapter.chapter_number,
              isPremium: chapter.is_premium,
              publishedAt: chapter.published_at
            })));
          }
          
          // Fetch comments
          const { comments: commentsData } = await getComments(comicData.id);
          if (commentsData) {
            setComments(commentsData.map(comment => ({
              id: comment.id,
              content: comment.content,
              createdAt: comment.created_at,
              user: {
                id: comment.profiles.id,
                username: comment.profiles.username,
                avatarUrl: comment.profiles.avatar_url
              }
            })));
          }
          
          // TODO: Check if comic is bookmarked by user
          // TODO: Fetch user's bookmark folders
        }
      } catch (error) {
        console.error('Error fetching comic details:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchComicDetails();
  }, [slug, user]);
  
  const handleAddComment = async (content: string) => {
    if (!user || !comic) return;
    
    // TODO: Add comment to database
    
    // Optimistically add comment to UI
    const newComment = {
      id: Date.now().toString(),
      content,
      createdAt: new Date().toISOString(),
      user: {
        id: user.id,
        username: profile?.username || user.email?.split('@')[0] || 'User',
        avatarUrl: profile?.avatar_url
      }
    };
    
    setComments([newComment, ...comments]);
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
            <div className="w-full md:w-1/3 lg:w-1/4">
              <div className="aspect-[2/3] bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            </div>
            <div className="flex-grow">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-3/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-6 w-1/2"></div>
              <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!comic) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Comic Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Oops! The comic you're looking for seems to have disappeared into another dimension.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Return Home
          </button>
        </div>
      </Layout>
    );
  }
  
  // Extract genres from comic data
  const genres = comic.comic_genres?.map((cg: any) => cg.genres) || [];
  
  // Mock preview images for demo
  const previewImages = [
    '/preview1.jpg',
    '/preview2.jpg',
    '/preview3.jpg',
    '/preview4.jpg'
  ];
  
  return (
    <Layout>
      {/* Top Ad Banner */}
      <AdBanner position="top" className="mb-8" />
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow">
          {/* Comic Header */}
          <ComicHeader
            title={comic.title}
            coverImage={comic.cover_image_url}
            author={{
              id: comic.author_id,
              name: comic.profiles?.display_name || comic.profiles?.username || 'Unknown Author'
            }}
            publicationDate={comic.publication_date}
            genres={genres}
            status={comic.status}
          />
          
          {/* Description */}
          <section className="mt-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Description</h2>
            <ComicDescription description={comic.description || 'No description available.'} />
          </section>
          
          {/* Preview */}
          <section className="mb-12">
            <ComicPreview previewImages={previewImages} comicSlug={comic.slug} />
          </section>
          
          {/* Chapters */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Chapters</h2>
            <ChapterList chapters={chapters} comicSlug={comic.slug} />
          </section>
          
          {/* Comments */}
          <section className="mb-8">
            <CommentSection 
              comments={comments} 
              onAddComment={handleAddComment} 
              isLoggedIn={!!user}
            />
          </section>
        </div>
        
        {/* Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0 order-first lg:order-last">
          <div className="sticky top-4">
            <AdBanner position="sidebar" className="mb-6" />
            
            {/* Bookmark Widget */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Bookmark</h3>
              <BookmarkManager 
                comicId={comic.id} 
                isBookmarked={isBookmarked} 
                folders={bookmarkFolders}
              />
            </div>
            
            {/* Related Comics Widget */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Related Comics</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Coming soon...
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Ad Banner */}
      <AdBanner position="bottom" className="mt-8" />
    </Layout>
  );
}
