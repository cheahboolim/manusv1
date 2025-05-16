import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ComicGrid } from '@/components/comics/ComicCard';
import { BookmarkFolderSidebar, NewFolderModal } from '@/components/bookmarks/BookmarkComponents';
import { getBookmarkFolders, getBookmarks, addBookmark, removeBookmark } from '@/lib/supabase/database';
import { useAuth } from '@/context/auth';

export default function BookmarksPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [folders, setFolders] = useState<any[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>('');
  const [bookmarkedComics, setBookmarkedComics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  
  useEffect(() => {
    // Redirect to sign in if not logged in
    if (!user) {
      router.push('/sign-in?redirect=/bookmarks');
      return;
    }
    
    async function fetchBookmarks() {
      try {
        setLoading(true);
        
        // Fetch user's bookmark folders
        const { folders: folderData } = await getBookmarkFolders(user.id);
        if (folderData && folderData.length > 0) {
          setFolders(folderData);
          
          // Set active folder to first folder or from query param
          const folderFromQuery = router.query.folder as string;
          const initialFolder = folderFromQuery || folderData[0].id;
          setActiveFolder(initialFolder);
          
          // Fetch bookmarks for active folder
          await fetchBookmarksForFolder(initialFolder);
        }
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBookmarks();
  }, [user, router]);
  
  const fetchBookmarksForFolder = async (folderId: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { bookmarks } = await getBookmarks(user.id, folderId);
      if (bookmarks) {
        setBookmarkedComics(bookmarks.map((bookmark: any) => bookmark.comics));
      } else {
        setBookmarkedComics([]);
      }
    } catch (error) {
      console.error('Error fetching bookmarks for folder:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFolderChange = (folderId: string) => {
    setActiveFolder(folderId);
    fetchBookmarksForFolder(folderId);
    
    // Update URL without full page reload
    router.push({
      pathname: '/bookmarks',
      query: { folder: folderId }
    }, undefined, { shallow: true });
  };
  
  const handleCreateFolder = async (folderName: string) => {
    if (!user) return;
    
    // TODO: Create new folder in database
    // For now, just add to local state
    const newFolder = {
      id: Date.now().toString(),
      user_id: user.id,
      name: folderName,
      is_default: false,
      created_at: new Date().toISOString()
    };
    
    setFolders([...folders, newFolder]);
  };
  
  const handleRemoveBookmark = async (comicId: string) => {
    if (!user || !activeFolder) return;
    
    try {
      // Remove from database
      await removeBookmark(user.id, comicId, activeFolder);
      
      // Update UI
      setBookmarkedComics(bookmarkedComics.filter(comic => comic.id !== comicId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };
  
  // Get active folder name
  const activeFolderName = folders.find(folder => folder.id === activeFolder)?.name || 'Bookmarks';
  
  return (
    <Layout>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <BookmarkFolderSidebar
          folders={folders}
          activeFolder={activeFolder}
          onFolderChange={handleFolderChange}
          onNewFolder={() => setShowNewFolderModal(true)}
        />
        
        {/* Main Content */}
        <div className="flex-grow">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {activeFolderName}
          </h1>
          
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-300 dark:bg-gray-700 rounded-lg aspect-[2/3]"></div>
                  <div className="mt-2 h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  <div className="mt-1 h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <ComicGrid
              comics={bookmarkedComics}
              onBookmark={handleRemoveBookmark}
              bookmarkedComics={bookmarkedComics.map(comic => comic.id)}
              emptyMessage={`No comics in ${activeFolderName}. Start adding some!`}
            />
          )}
        </div>
      </div>
      
      {/* New Folder Modal */}
      <NewFolderModal
        isOpen={showNewFolderModal}
        onClose={() => setShowNewFolderModal(false)}
        onSubmit={handleCreateFolder}
      />
    </Layout>
  );
}
