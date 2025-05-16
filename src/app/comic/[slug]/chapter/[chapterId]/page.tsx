import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ComicReader } from '@/components/reader/ComicReader';
import { getChapter, getPages, updateReadingProgress } from '@/lib/supabase/database';
import { useAuth } from '@/context/auth';

export default function ReaderPage() {
  const router = useRouter();
  const { slug, chapterId } = router.query;
  const { user } = useAuth();
  
  const [comic, setComic] = useState<any>(null);
  const [chapter, setChapter] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchChapterData() {
      if (!chapterId) return;
      
      try {
        setLoading(true);
        
        // Fetch chapter details
        const { chapter: chapterData } = await getChapter(chapterId as string);
        if (chapterData) {
          setChapter(chapterData);
          
          // Fetch comic details (from parent route or API)
          // For now, we'll use a placeholder
          setComic({
            id: chapterData.comic_id,
            title: slug as string,
            slug: slug as string
          });
          
          // Fetch pages
          const { pages: pagesData } = await getPages(chapterId as string);
          if (pagesData) {
            setPages(pagesData);
          }
        }
      } catch (error) {
        console.error('Error fetching chapter data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchChapterData();
  }, [chapterId, slug]);
  
  const handlePageChange = async (pageNumber: number) => {
    if (!user || !comic || !chapter) return;
    
    // Update reading progress in database
    try {
      await updateReadingProgress(
        user.id,
        comic.id,
        chapter.id,
        pageNumber
      );
    } catch (error) {
      console.error('Error updating reading progress:', error);
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="bg-gray-300 dark:bg-gray-700 h-[60vh] w-[80vw] max-w-3xl rounded-lg"></div>
            <div className="mt-4 h-4 bg-gray-300 dark:bg-gray-700 rounded w-48"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!chapter || !comic) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Chapter Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Oops! The chapter you're looking for seems to have disappeared into another dimension.
          </p>
          <button
            onClick={() => router.push(`/comic/${slug}`)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Return to Comic
          </button>
        </div>
      </Layout>
    );
  }
  
  return (
    <ComicReader
      pages={pages}
      initialPage={1}
      onPageChange={handlePageChange}
      comicTitle={comic.title}
      chapterTitle={`Chapter ${chapter.chapter_number}: ${chapter.title}`}
      isPremium={chapter.is_premium}
    />
  );
}
