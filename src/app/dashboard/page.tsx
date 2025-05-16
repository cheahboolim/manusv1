import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/context/auth';
import { getUserComicStats, getUserBookmarkStats } from '@/lib/supabase/database';
import Link from 'next/link';

/**
 * Dashboard Home Page
 * 
 * Main dashboard landing page showing user stats and quick actions
 */
export default function DashboardHomePage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [comicStats, setComicStats] = useState<any>({
    total_comics: 0,
    total_pages: 0,
    total_views: 0,
    total_bookmarks: 0
  });
  const [bookmarkStats, setBookmarkStats] = useState<any>({
    total_folders: 0,
    total_bookmarks: 0,
    folders_remaining: 100
  });
  
  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);
  
  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch comic stats
      const { stats: comics } = await getUserComicStats(user.id);
      if (comics) {
        setComicStats(comics);
      }
      
      // Fetch bookmark stats
      const { stats: bookmarks } = await getUserBookmarkStats(user.id);
      if (bookmarks) {
        setBookmarkStats(bookmarks);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
        
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.username || user?.email || "User"} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                  {(profile?.username || user?.email || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Welcome back, {profile?.display_name || profile?.username || user?.email?.split('@')[0] || "User"}!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your comics, bookmarks, and account settings from your personal dashboard.
              </p>
              
              <div className="mt-4 flex flex-wrap gap-3">
                <Link 
                  href="/dashboard/comics/upload"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Upload Comic
                </Link>
                <Link 
                  href="/dashboard/bookmarks"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Manage Bookmarks
                </Link>
                <Link 
                  href="/dashboard/settings"
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Comic Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Comics</h3>
              <Link 
                href="/dashboard/comics"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Comics</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{comicStats.total_comics}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-green-600 dark:text-green-400 text-sm font-medium">Total Pages</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{comicStats.total_pages}</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="text-purple-600 dark:text-purple-400 text-sm font-medium">Total Views</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{comicStats.total_views}</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <div className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Bookmarked By</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{comicStats.total_bookmarks}</div>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <Link 
                href="/dashboard/comics/upload"
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Upload New Comic
              </Link>
            </div>
          </div>
          
          {/* Bookmark Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Bookmarks</h3>
              <Link 
                href="/dashboard/bookmarks"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                  <div className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">Total Folders</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{bookmarkStats.total_folders}</div>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4">
                  <div className="text-pink-600 dark:text-pink-400 text-sm font-medium">Total Bookmarks</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{bookmarkStats.total_bookmarks}</div>
                </div>
                <div className="col-span-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4">
                  <div className="text-teal-600 dark:text-teal-400 text-sm font-medium">Folders Remaining</div>
                  <div className="flex items-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{bookmarkStats.folders_remaining}</div>
                    <div className="text-gray-500 dark:text-gray-400 ml-2 mt-1">/ 100</div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-teal-600 h-2.5 rounded-full" 
                      style={{ width: `${100 - (bookmarkStats.folders_remaining)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <Link 
                href="/dashboard/bookmarks"
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Folder
              </Link>
            </div>
          </div>
        </div>
        
        {/* Quick Links Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/dashboard/comics/upload"
              className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-gray-900 dark:text-white font-medium">Upload Comic</span>
            </Link>
            
            <Link 
              href="/dashboard/comics"
              className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-gray-900 dark:text-white font-medium">My Comics</span>
            </Link>
            
            <Link 
              href="/dashboard/bookmarks"
              className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="text-gray-900 dark:text-white font-medium">Bookmarks</span>
            </Link>
            
            <Link 
              href="/dashboard/settings"
              className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-900 dark:text-white font-medium">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
