import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/context/auth';
import { getUserComics, deleteUserComic } from '@/lib/supabase/database';
import Link from 'next/link';

/**
 * Manage Comics Page
 * 
 * Displays user's uploaded comics with pagination and management options
 */
export default function ManageComicsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { page = '1' } = router.query;
  
  const [comics, setComics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalComics, setTotalComics] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [comicToDelete, setComicToDelete] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const COMICS_PER_PAGE = 12;
  
  useEffect(() => {
    if (!user) {
      router.push('/sign-in?redirect=/dashboard/comics');
      return;
    }
    
    // Set current page from URL
    if (page && !isNaN(Number(page))) {
      setCurrentPage(Number(page));
    }
  }, [user, router, page]);
  
  useEffect(() => {
    if (user && currentPage) {
      fetchUserComics(currentPage);
    }
  }, [user, currentPage]);
  
  const fetchUserComics = async (page: number) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { comics: userComics, count, error } = await getUserComics(user.id, page, COMICS_PER_PAGE);
      
      if (error) throw error;
      
      if (userComics) {
        setComics(userComics);
        setTotalComics(count || 0);
      }
    } catch (err) {
      console.error('Error fetching user comics:', err);
      setError('Failed to load your comics. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    
    // Update URL without full page reload
    router.push({
      pathname: '/dashboard/comics',
      query: { page: newPage }
    }, undefined, { shallow: true });
  };
  
  const confirmDelete = (comic: any) => {
    setComicToDelete(comic);
    setShowDeleteModal(true);
  };
  
  const handleDeleteComic = async () => {
    if (!user || !comicToDelete) return;
    
    try {
      setIsDeleting(comicToDelete.id);
      
      const { error } = await deleteUserComic(user.id, comicToDelete.id);
      
      if (error) throw error;
      
      // Remove from UI
      setComics(comics.filter(c => c.id !== comicToDelete.id));
      setTotalComics(totalComics - 1);
      
      // Show success message
      setSuccess(`"${comicToDelete.title}" has been deleted.`);
      
      // Close modal
      setShowDeleteModal(false);
      setComicToDelete(null);
      
      // If this was the last comic on the page, go to previous page
      const totalPages = Math.ceil((totalComics - 1) / COMICS_PER_PAGE);
      if (comics.length === 1 && currentPage > 1 && currentPage > totalPages) {
        handlePageChange(currentPage - 1);
      }
    } catch (err) {
      console.error('Error deleting comic:', err);
      setError('Failed to delete comic. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(totalComics / COMICS_PER_PAGE);
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Comics</h1>
          
          <Link 
            href="/dashboard/comics/upload"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Upload Comic
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-300 dark:bg-gray-700 rounded-lg aspect-[2/3]"></div>
                  <div className="mt-2 h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  <div className="mt-1 h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : comics.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">No Comics Yet</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                You haven't uploaded any comics yet. Start sharing your work with the world!
              </p>
              <Link 
                href="/dashboard/comics/upload"
                className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Upload Your First Comic
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {comics.map(comic => (
                  <div key={comic.id} className="group relative">
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                      {comic.cover_image_url ? (
                        <img 
                          src={comic.cover_image_url} 
                          alt={comic.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          No Cover
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
                        comic.status === 'published' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : comic.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                      }`}>
                        {comic.status.charAt(0).toUpperCase() + comic.status.slice(1)}
                      </div>
                      
                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Link
                          href={`/comic/${comic.slug}`}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                          aria-label={`View ${comic.title}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/dashboard/comics/${comic.id}/edit`}
                          className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full"
                          aria-label={`Edit ${comic.title}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => confirmDelete(comic)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full"
                          aria-label={`Delete ${comic.title}`}
                          disabled={isDeleting === comic.id}
                        >
                          {isDeleting === comic.id ? (
                            <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">{comic.title}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{comic.artist}</p>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {comic.view_count || 0}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(comic.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {comic.page_count} pages
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                               text-gray-700 dark:text-gray-300 
                               disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="First page"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                               text-gray-700 dark:text-gray-300 
                               disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Calculate page numbers to show
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={i}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded-md ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                               text-gray-700 dark:text-gray-300 
                               disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                               text-gray-700 dark:text-gray-300 
                               disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Last page"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && comicToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delete Comic</h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{comicToDelete.title}"? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setComicToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
                         text-gray-800 dark:text-white font-medium rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteComic}
                disabled={isDeleting === comicToDelete.id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isDeleting === comicToDelete.id ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Comic'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
