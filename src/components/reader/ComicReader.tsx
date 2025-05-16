import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/auth';

type ReaderControlsProps = {
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFullscreen: () => void;
};

/**
 * ReaderControls Component
 * 
 * Provides navigation and zoom controls for the comic reader.
 * Used in the chapter reading page.
 */
export function ReaderControls({
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onFullscreen
}: ReaderControlsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 backdrop-blur-sm p-2 z-10">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                     hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                     hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onZoomOut}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                     hover:bg-gray-300 dark:hover:bg-gray-700"
            aria-label="Zoom out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <button
            onClick={onZoomIn}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                     hover:bg-gray-300 dark:hover:bg-gray-700"
            aria-label="Zoom in"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <button
            onClick={onFullscreen}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                     hover:bg-gray-300 dark:hover:bg-gray-700"
            aria-label="Toggle fullscreen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

type ComicReaderProps = {
  pages: {
    id: string;
    pageNumber: number;
    imageUrl: string;
  }[];
  initialPage?: number;
  onPageChange?: (pageNumber: number) => void;
  comicTitle: string;
  chapterTitle: string;
  isPremium?: boolean;
};

/**
 * ComicReader Component
 * 
 * Main component for reading comic pages with navigation and zoom controls.
 * Used in the chapter reading page.
 */
export function ComicReader({
  pages,
  initialPage = 1,
  onPageChange,
  comicTitle,
  chapterTitle,
  isPremium = false
}: ComicReaderProps) {
  const { user, profile } = useAuth();
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [zoom, setZoom] = React.useState(1);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  
  // Check if user can access premium content
  const canAccessPremium = !isPremium || (user && profile && profile.credits > 0);
  
  // Get current page data
  const currentPageData = pages.find(page => page.pageNumber === currentPage) || pages[0];
  
  // Handle page navigation
  const goToPrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      if (onPageChange) onPageChange(newPage);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < pages.length) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      if (onPageChange) onPageChange(newPage);
    }
  };
  
  // Handle zoom
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  
  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  
  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage]);
  
  // Premium content paywall
  if (isPremium && !canAccessPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 bg-gray-100 dark:bg-gray-900 rounded-lg">
        <div className="text-center max-w-md">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-yellow-500"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Premium Content</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This chapter requires credits to unlock. Purchase credits to continue reading.
          </p>
          <div className="space-y-3">
            <button
              className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-md transition-colors"
            >
              Purchase Credits
            </button>
            {!user && (
              <a
                href="/sign-in"
                className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-center transition-colors"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{comicTitle}</h1>
          <h2 className="text-gray-600 dark:text-gray-400">{chapterTitle}</h2>
        </div>
      </div>
      
      {/* Reader Area */}
      <div 
        className="flex justify-center items-center min-h-[calc(100vh-12rem)] p-4"
        onClick={goToNextPage}
      >
        <div 
          className="relative cursor-pointer transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          {currentPageData && (
            <Image
              src={currentPageData.imageUrl}
              alt={`Page ${currentPage}`}
              width={800}
              height={1200}
              className="max-h-[80vh] w-auto object-contain"
              priority
            />
          )}
        </div>
      </div>
      
      {/* Controls */}
      <ReaderControls
        currentPage={currentPage}
        totalPages={pages.length}
        onPrevPage={goToPrevPage}
        onNextPage={goToNextPage}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFullscreen={toggleFullscreen}
      />
    </div>
  );
}
