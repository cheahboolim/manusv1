import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ComicGrid } from '@/components/comics/ComicCard';
import { useAuth } from '@/context/auth';
import { 
  getBookmarkFolders, 
  getBookmarks, 
  createBookmarkFolder,
  updateBookmarkFolder,
  deleteBookmarkFolder,
  removeBookmark,
  getUserBookmarkStats
} from '@/lib/supabase/database';

/**
 * Enhanced Bookmark Management Page
 * 
 * Provides a dashboard interface for managing bookmark folders and comics
 */
export default function BookmarksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { folderId } = router.query;
  
  const [folders, setFolders] = useState<any[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>('');
  const [bookmarkedComics, setBookmarkedComics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [folderLoading, setFolderLoading] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [bookmarkStats, setBookmarkStats] = useState<any>({
    total_folders: 0,
    total_bookmarks: 0,
    folders_remaining: 100
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Drag and drop refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  useEffect(() => {
    if (!user) {
      router.push('/sign-in?redirect=/dashboard/bookmarks');
      return;
    }
    
    fetchBookmarkData();
  }, [user, router]);
  
  useEffect(() => {
    if (folderId && folders.length > 0) {
      const folderExists = folders.some(folder => folder.id === folderId);
      if (folderExists) {
        setActiveFolder(folderId as string);
        fetchBookmarksForFolder(folderId as string);
      } else {
        // If folder doesn't exist, set active folder to first folder
        setActiveFolder(folders[0].id);
        fetchBookmarksForFolder(folders[0].id);
        
        // Update URL without full page reload
        router.push({
          pathname: '/dashboard/bookmarks',
          query: { folderId: folders[0].id }
        }, undefined, { shallow: true });
      }
    } else if (folders.length > 0 && !activeFolder) {
      // If no folder is selected, set active folder to first folder
      setActiveFolder(folders[0].id);
      fetchBookmarksForFolder(folders[0].id);
      
      // Update URL without full page reload
      router.push({
        pathname: '/dashboard/bookmarks',
        query: { folderId: folders[0].id }
      }, undefined, { shallow: true });
    }
  }, [folders, folderId]);
  
  const fetchBookmarkData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch user's bookmark folders
      const { folders: folderData } = await getBookmarkFolders(user.id);
      if (folderData) {
        // Sort folders by display_order
        const sortedFolders = [...folderData].sort((a, b) => a.display_order - b.display_order);
        setFolders(sortedFolders);
      }
      
      // Fetch bookmark stats
      const { stats } = await getUserBookmarkStats(user.id);
      if (stats) {
        setBookmarkStats(stats);
      }
      
    } catch (error) {
      console.error('Error fetching bookmark data:', error);
      setError('Failed to load bookmarks. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchBookmarksForFolder = async (folderId: string) => {
    if (!user) return;
    
    try {
      setFolderLoading(true);
      
      const { bookmarks } = await getBookmarks(user.id, folderId);
      if (bookmarks) {
        // Sort bookmarks by display_order
        const sortedBookmarks = [...bookmarks]
          .sort((a, b) => a.display_order - b.display_order)
          .map(bookmark => bookmark.comics);
        
        setBookmarkedComics(sortedBookmarks);
      } else {
        setBookmarkedComics([]);
      }
    } catch (error) {
      console.error('Error fetching bookmarks for folder:', error);
    } finally {
      setFolderLoading(false);
    }
  };
  
  const handleFolderChange = (folderId: string) => {
    setActiveFolder(folderId);
    fetchBookmarksForFolder(folderId);
    
    // Update URL without full page reload
    router.push({
      pathname: '/dashboard/bookmarks',
      query: { folderId }
    }, undefined, { shallow: true });
  };
  
  const handleCreateFolder = async (folderData: { name: string, color: string, icon: string }) => {
    if (!user) return;
    
    // Check if folder limit reached
    if (bookmarkStats.folders_remaining <= 0) {
      setError('You have reached the maximum number of folders (100).');
      return;
    }
    
    try {
      // Create new folder in database
      const { folder, error } = await createBookmarkFolder({
        user_id: user.id,
        name: folderData.name,
        is_default: false,
        display_order: folders.length,
        color: folderData.color,
        icon: folderData.icon
      });
      
      if (error) throw error;
      
      if (folder) {
        // Update local state
        setFolders([...folders, folder]);
        
        // Update stats
        setBookmarkStats({
          ...bookmarkStats,
          total_folders: bookmarkStats.total_folders + 1,
          folders_remaining: bookmarkStats.folders_remaining - 1
        });
        
        setSuccess(`Folder "${folderData.name}" created successfully.`);
        
        // Set as active folder
        setActiveFolder(folder.id);
        fetchBookmarksForFolder(folder.id);
        
        // Update URL
        router.push({
          pathname: '/dashboard/bookmarks',
          query: { folderId: folder.id }
        }, undefined, { shallow: true });
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      setError('Failed to create folder. Please try again.');
    }
  };
  
  const handleEditFolder = (folder: any) => {
    setEditingFolder(folder);
    setShowEditFolderModal(true);
  };
  
  const handleUpdateFolder = async (folderData: { name: string, color: string, icon: string }) => {
    if (!user || !editingFolder) return;
    
    try {
      // Update folder in database
      const { folder, error } = await updateBookmarkFolder(editingFolder.id, {
        name: folderData.name,
        color: folderData.color,
        icon: folderData.icon
      });
      
      if (error) throw error;
      
      if (folder) {
        // Update local state
        setFolders(folders.map(f => f.id === folder.id ? folder : f));
        setSuccess(`Folder "${folderData.name}" updated successfully.`);
      }
    } catch (err) {
      console.error('Error updating folder:', err);
      setError('Failed to update folder. Please try again.');
    } finally {
      setEditingFolder(null);
      setShowEditFolderModal(false);
    }
  };
  
  const handleDeleteFolder = async (folderId: string) => {
    if (!user) return;
    
    // Don't allow deleting default folders
    const folder = folders.find(f => f.id === folderId);
    if (folder?.is_default) {
      setError('Cannot delete default folders.');
      return;
    }
    
    try {
      // Delete folder from database
      const { error } = await deleteBookmarkFolder(folderId);
      
      if (error) throw error;
      
      // Update local state
      setFolders(folders.filter(f => f.id !== folderId));
      
      // Update stats
      setBookmarkStats({
        ...bookmarkStats,
        total_folders: bookmarkStats.total_folders - 1,
        folders_remaining: bookmarkStats.folders_remaining + 1
      });
      
      setSuccess('Folder deleted successfully.');
      
      // If active folder was deleted, set active folder to first folder
      if (activeFolder === folderId && folders.length > 0) {
        const remainingFolders = folders.filter(f => f.id !== folderId);
        if (remainingFolders.length > 0) {
          setActiveFolder(remainingFolders[0].id);
          fetchBookmarksForFolder(remainingFolders[0].id);
          
          // Update URL
          router.push({
            pathname: '/dashboard/bookmarks',
            query: { folderId: remainingFolders[0].id }
          }, undefined, { shallow: true });
        }
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError('Failed to delete folder. Please try again.');
    }
  };
  
  const handleRemoveBookmark = async (comicId: string) => {
    if (!user || !activeFolder) return;
    
    try {
      // Remove from database
      const { error } = await removeBookmark(user.id, comicId, activeFolder);
      
      if (error) throw error;
      
      // Update UI
      setBookmarkedComics(bookmarkedComics.filter(comic => comic.id !== comicId));
      
      // Update stats
      setBookmarkStats({
        ...bookmarkStats,
        total_bookmarks: bookmarkStats.total_bookmarks - 1
      });
      
      setSuccess('Comic removed from bookmarks.');
    } catch (error) {
      console.error('Error removing bookmark:', error);
      setError('Failed to remove bookmark. Please try again.');
    }
  };
  
  // Handle drag and drop for folders
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };
  
  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };
  
  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    // Make a copy of the folders array
    const foldersCopy = [...folders];
    
    // Get the dragged item
    const draggedItem = foldersCopy[dragItem.current];
    
    // Remove the dragged item from the array
    foldersCopy.splice(dragItem.current, 1);
    
    // Insert the dragged item at the new position
    foldersCopy.splice(dragOverItem.current, 0, draggedItem);
    
    // Update the display_order for each folder
    const updatedFolders = foldersCopy.map((folder, index) => ({
      ...folder,
      display_order: index
    }));
    
    // Update the state
    setFolders(updatedFolders);
    
    // Reset the refs
    dragItem.current = null;
    dragOverItem.current = null;
    
    // Update the database
    try {
      // Update each folder's display_order in the database
      for (const folder of updatedFolders) {
        await updateBookmarkFolder(folder.id, {
          display_order: folder.display_order
        });
      }
    } catch (error) {
      console.error('Error updating folder order:', error);
      setError('Failed to update folder order. Please try again.');
      
      // Revert to original order
      fetchBookmarkData();
    }
  };
  
  // Get active folder name
  const activeFolderData = folders.find(folder => folder.id === activeFolder);
  const activeFolderName = activeFolderData?.name || 'Bookmarks';
  const activeFolderColor = activeFolderData?.color || '#3498db';
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookmarks</h1>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span>{bookmarkStats.total_folders} folders</span>
            <span>•</span>
            <span>{bookmarkStats.total_bookmarks} bookmarks</span>
            <span>•</span>
            <span>{bookmarkStats.folders_remaining} folders remaining</span>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {success}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Folders Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
              <button
                onClick={() => setShowNewFolderModal(true)}
                disabled={bookmarkStats.folders_remaining <= 0}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                New Folder
              </button>
              
              {bookmarkStats.folders_remaining <= 0 && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-400">
                  You have reached the maximum number of folders (100).
                </p>
              )}
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              {loading ? (
                <div className="p-4">
                  <div className="animate-pulse space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : folders.length === 0 ? (
                <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                  No folders found. Create your first folder to start organizing your bookmarks.
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  {folders.map((folder, index) => (
                    <div
                      key={folder.id}
                      draggable={!folder.is_default}
                      onDragStart={() => handleDragStart(index)}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      className={`relative group ${
                        folder.id === activeFolder 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      } transition-colors cursor-pointer`}
                    >
                      <button
                        onClick={() => handleFolderChange(folder.id)}
                        className="w-full flex items-center px-4 py-3 text-left"
                      >
                        <div 
                          className="w-4 h-4 rounded-full mr-3 flex-shrink-0" 
                          style={{ backgroundColor: folder.color || '#3498db' }}
                        ></div>
                        <span className={`truncate ${
                          folder.id === activeFolder 
                            ? 'text-blue-700 dark:text-blue-400 font-medium' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {folder.name}
                        </span>
                      </button>
                      
                      {!folder.is_default && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 hidden group-hover:flex items-center space-x-1">
                          <button
                            onClick={() => handleEditFolder(folder)}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            aria-label="Edit folder"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            aria-label="Delete folder"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-grow">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <div 
                  className="w-5 h-5 rounded-full mr-3" 
                  style={{ backgroundColor: activeFolderColor }}
                ></div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {activeFolderName}
                </h2>
              </div>
              
              {folderLoading ? (
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
        </div>
      </div>
      
      {/* New Folder Modal */}
      {showNewFolderModal && (
        <FolderModal
          isOpen={showNewFolderModal}
          onClose={() => setShowNewFolderModal(false)}
          onSubmit={handleCreateFolder}
          title="Create New Folder"
          submitText="Create Folder"
        />
      )}
      
      {/* Edit Folder Modal */}
      {showEditFolderModal && editingFolder && (
        <FolderModal
          isOpen={showEditFolderModal}
          onClose={() => {
            setShowEditFolderModal(false);
            setEditingFolder(null);
          }}
          onSubmit={handleUpdateFolder}
          title="Edit Folder"
          submitText="Update Folder"
          initialData={{
            name: editingFolder.name,
            color: editingFolder.color,
            icon: editingFolder.icon
          }}
        />
      )}
    </DashboardLayout>
  );
}

/**
 * Folder Modal Component
 * 
 * Modal for creating or editing bookmark folders
 */
function FolderModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  submitText,
  initialData = { name: '', color: '#3498db', icon: 'folder' }
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string, color: string, icon: string }) => void;
  title: string;
  submitText: string;
  initialData?: { name: string, color: string, icon: string };
}) {
  const [folderName, setFolderName] = useState(initialData.name);
  const [folderColor, setFolderColor] = useState(initialData.color);
  const [folderIcon, setFolderIcon] = useState(initialData.icon);
  const [error, setError] = useState<string | null>(null);
  
  const colorOptions = [
    { name: 'Blue', value: '#3498db' },
    { name: 'Green', value: '#2ecc71' },
    { name: 'Red', value: '#e74c3c' },
    { name: 'Purple', value: '#9b59b6' },
    { name: 'Orange', value: '#f39c12' },
    { name: 'Teal', value: '#1abc9c' },
    { name: 'Pink', value: '#e84393' },
    { name: 'Gray', value: '#636e72' }
  ];
  
  const iconOptions = [
    { name: 'Folder', value: 'folder' },
    { name: 'Star', value: 'star' },
    { name: 'Heart', value: 'heart' },
    { name: 'Bookmark', value: 'bookmark' },
    { name: 'Book', value: 'book' },
    { name: 'Fire', value: 'fire' },
    { name: 'Lightning', value: 'lightning' },
    { name: 'Tag', value: 'tag' }
  ];
  
  if (!isOpen) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }
    
    onSubmit({
      name: folderName,
      color: folderColor,
      icon: folderIcon
    });
    
    // Reset form
    setFolderName('');
    setFolderColor('#3498db');
    setFolderIcon('folder');
    setError(null);
    
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Folder Name
            </label>
            <input
              id="folderName"
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="My Favorites"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Folder Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFolderColor(color.value)}
                  className={`w-full aspect-square rounded-full border-2 ${
                    folderColor === color.value 
                      ? 'border-gray-900 dark:border-white' 
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  aria-label={`Select ${color.name} color`}
                />
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Folder Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {iconOptions.map(icon => (
                <button
                  key={icon.value}
                  type="button"
                  onClick={() => setFolderIcon(icon.value)}
                  className={`w-full py-2 rounded-md border ${
                    folderIcon === icon.value 
                      ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300' 
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {icon.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
                       text-gray-800 dark:text-white font-medium rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
