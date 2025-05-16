import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ComicGrid } from '@/components/comics/ComicCard';
import { SectionHeader } from '@/components/layout/Layout';
import { searchComics } from '@/lib/supabase/database';
import { useAuth } from '@/context/auth';

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;
  const { user } = useAuth();
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedComics, setBookmarkedComics] = useState<string[]>([]);
  
  useEffect(() => {
    async function performSearch() {
      if (!q) return;
      
      try {
        setLoading(true);
        
        // Search comics
        const { comics } = await searchComics(q as string, 20);
        if (comics) {
          setSearchResults(comics);
        }
        
        // TODO: Fetch user's bookmarked comics if logged in
        
      } catch (error) {
        console.error('Error searching comics:', error);
      } finally {
        setLoading(false);
      }
    }
    
    performSearch();
  }, [q, user]);
  
  const handleBookmark = (comicId: string) => {
    // If not logged in, redirect to sign in
    if (!user) {
      router.push('/sign-in?redirect=' + encodeURIComponent(router.asPath));
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
      <div className="mb-8">
        <SectionHeader 
          title={q ? `Search Results for "${q}"` : 'Search Comics'} 
        />
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 dark:bg-gray-700 rounded-lg aspect-[2/3]"></div>
                <div className="mt-2 h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="mt-1 h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <ComicGrid 
            comics={searchResults} 
            onBookmark={handleBookmark}
            bookmarkedComics={bookmarkedComics}
            emptyMessage={q ? `No comics found for "${q}"` : 'Enter a search term to find comics'}
          />
        )}
      </div>
    </Layout>
  );
}
