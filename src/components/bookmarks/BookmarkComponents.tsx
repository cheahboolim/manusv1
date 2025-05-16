import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth';
import { BookmarkFolder } from '@/lib/supabase/database';

type BookmarkFolderItemProps = {
  folder: BookmarkFolder;
  isActive: boolean;
  onClick: () => void;
};

/**
 * BookmarkFolderItem Component
 * 
 * Displays a single bookmark folder item with appropriate styling.
 * Used in the bookmark management sidebar.
 */
export function BookmarkFolderItem({ folder, isActive, onClick }: BookmarkFolderItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' 
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <div className="flex items-center">
        <svg
          className={`w-5 h-5 mr-2 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z"
            clipRule="evenodd"
          />
        </svg>
        <span>{folder.name}</span>
      </div>
    </button>
  );
}

type NewFolderButtonProps = {
  onClick: () => void;
};

/**
 * NewFolderButton Component
 * 
 * Button to create a new bookmark folder.
 * Used in the bookmark management sidebar.
 */
export function NewFolderButton({ onClick }: NewFolderButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-md transition-colors"
    >
      <svg
        className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400"
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
  );
}

type NewFolderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (folderName: string) => void;
};

/**
 * NewFolderModal Component
 * 
 * Modal dialog for creating a new bookmark folder.
 * Used in the bookmarks page.
 */
export function NewFolderModal({ isOpen, onClose, onSubmit }: NewFolderModalProps) {
  const [folderName, setFolderName] = React.useState('');
  
  if (!isOpen) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onSubmit(folderName);
      setFolderName('');
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Folder</h2>
        
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
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type BookmarkFolderSidebarProps = {
  folders: BookmarkFolder[];
  activeFolder: string;
  onFolderChange: (folderId: string) => void;
  onNewFolder: () => void;
};

/**
 * BookmarkFolderSidebar Component
 * 
 * Sidebar for navigating between bookmark folders.
 * Used in the bookmarks page.
 */
export function BookmarkFolderSidebar({ 
  folders, 
  activeFolder, 
  onFolderChange, 
  onNewFolder 
}: BookmarkFolderSidebarProps) {
  return (
    <div className="w-full md:w-64 flex-shrink-0">
      <div className="mb-4">
        <NewFolderButton onClick={onNewFolder} />
      </div>
      
      <div className="space-y-1">
        {folders.map(folder => (
          <BookmarkFolderItem
            key={folder.id}
            folder={folder}
            isActive={folder.id === activeFolder}
            onClick={() => onFolderChange(folder.id)}
          />
        ))}
      </div>
    </div>
  );
}

type BookmarkManagerProps = {
  comicId: string;
  isBookmarked: boolean;
  folders?: BookmarkFolder[];
};

/**
 * BookmarkManager Component
 * 
 * Manages bookmarking a comic to different folders.
 * Used in comic details page.
 */
export function BookmarkManager({ comicId, isBookmarked, folders = [] }: BookmarkManagerProps) {
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = React.useState(false);
  
  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
                 text-gray-800 dark:text-white font-medium rounded-md transition-colors"
      >
        <svg
          className="w-5 h-5 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        Sign in to Bookmark
      </Link>
    );
  }
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`inline-flex items-center px-4 py-2 font-medium rounded-md transition-colors ${
          isBookmarked 
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-900/50' 
            : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white'
        }`}
      >
        <svg
          className={`w-5 h-5 mr-1 ${isBookmarked ? 'text-yellow-600 dark:text-yellow-400' : ''}`}
          fill={isBookmarked ? "currentColor" : "none"}
          stroke={isBookmarked ? "" : "currentColor"}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
      </button>
      
      {showDropdown && (
        <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {folders.map(folder => (
              <button
                key={folder.id}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                role="menuitem"
                onClick={() => {
                  // Handle bookmark toggle for this folder
                  setShowDropdown(false);
                }}
              >
                {folder.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
