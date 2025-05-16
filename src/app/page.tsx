import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ComicGrid } from '@/components/comics/ComicCard';
import { AdBanner, SectionHeader } from '@/components/layout/Layout';
import { getLatestComics, getPopularComics, Comic } from '@/lib/supabase/database';
import { useAuth } from '@/context/auth';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [recommendedComics, setRecommendedComics] = useState<Comic[]>([]);
  const [latestComics, setLatestComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedComics, setBookmarkedComics] = useState<string[]>([]);

  useEffect(() => {
    async function fetchComics() {
      try {
        setLoading(true);
        
        // Fetch popular comics for recommendations
        const { comics: popular } = await getPopularComics(10);
        if (popular) setRecommendedComics(popular as Comic[]);
        
        // Fetch latest comics
        const { comics: latest } = await getLatestComics(10);
        if (latest) setLatestComics(latest as Comic[]);
        
        // TODO: Fetch user's bookmarked comics if logged in
        
      } catch (error) {
        console.error('Error fetching comics:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchComics();
  }, [user]);

  const handleBookmark = (comicId: string) => {
    // If not logged in, redirect to sign in
    if (!user) {
      router.push('/sign-in?redirect=/' + encodeURIComponent(router.asPath));
      return;
    }
    
    // Toggle bookmark status
    setBookmarkedComics(prev => {
      if (prev.includes(comicId)) {
        return prev.filter(id => id !== comicId);
      } else {
        return [...prev, comicId];
      }
    });
    
    // TODO: Update bookmark in database
  };

  return (
    <Layout>
      {/* Top Ad Banner */}
      <AdBanner position="top" className="mb-8" />
      
      {/* Recommended Comics Section */}
      <section className="mb-12">
        <SectionHeader 
          title="Recommended For You" 
          actionLink="/explore" 
          actionText="View All"
        />
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 dark:bg-gray-700 rounded-lg aspect-[2/3]"></div>
                <div className="mt-2 h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="mt-1 h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <ComicGrid 
            comics={recommendedComics} 
            onBookmark={handleBookmark}
            bookmarkedComics={bookmarkedComics}
            emptyMessage="No recommendations available yet. Start exploring comics!"
          />
        )}
      </section>
      
      {/* Latest Comics Section */}
      <section className="mb-12">
        <SectionHeader 
          title="Latest Comics" 
          actionLink="/latest" 
          actionText="View All"
        />
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 dark:bg-gray-700 rounded-lg aspect-[2/3]"></div>
                <div className="mt-2 h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="mt-1 h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <ComicGrid 
            comics={latestComics} 
            onBookmark={handleBookmark}
            bookmarkedComics={bookmarkedComics}
            emptyMessage="No comics available yet. Check back soon!"
          />
        )}
      </section>
      
      {/* Bottom Ad Banner */}
      <AdBanner position="bottom" />
    </Layout>
  );
}
