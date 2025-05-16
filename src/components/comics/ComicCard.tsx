import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Comic } from '@/lib/supabase/database';

type ComicCardProps = {
  comic: Comic & {
    profiles?: {
      username: string;
      display_name?: string;
    };
  };
  onBookmark?: () => void;
  isBookmarked?: boolean;
};

/**
 * ComicCard Component
 * 
 * Displays a comic card with cover image, title, author, and bookmark button.
 * Used in comic listings, recommendations, and bookmark collections.
 */
export function ComicCard({ comic, onBookmark, isBookmarked = false }: ComicCardProps) {
  const authorName = comic.profiles?.display_name || comic.profiles?.username || 'Unknown Author';
  
  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      {/* Comic Cover Image */}
      <Link href={`/comic/${comic.slug}`} className="block aspect-[2/3] relative overflow-hidden">
        {comic.cover_image_url ? (
          <Image
            src={comic.cover_image_url}
            alt={comic.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </Link>

      {/* Bookmark Button */}
      {onBookmark && (
        <button
          onClick={onBookmark}
          className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
        >
          {isBookmarked ? (
            <svg
              className="w-5 h-5 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
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
          )}
        </button>
      )}

      {/* Comic Info */}
      <div className="p-4">
        <Link href={`/comic/${comic.slug}`} className="block">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {comic.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {authorName}
        </p>
        
        {/* Status Badge */}
        <div className="mt-2">
          {comic.status === 'ongoing' && (
            <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
              Ongoing
            </span>
          )}
          {comic.status === 'completed' && (
            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
              Completed
            </span>
          )}
          {comic.status === 'hiatus' && (
            <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">
              Hiatus
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

type ComicGridProps = {
  comics: ComicCardProps['comic'][];
  onBookmark?: (comicId: string) => void;
  bookmarkedComics?: string[];
  emptyMessage?: string;
};

/**
 * ComicGrid Component
 * 
 * Displays a responsive grid of comic cards.
 * Used in homepage, explore page, and bookmarks page.
 */
export function ComicGrid({ 
  comics, 
  onBookmark, 
  bookmarkedComics = [], 
  emptyMessage = "No comics found" 
}: ComicGridProps) {
  if (!comics || comics.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
      {comics.map((comic) => (
        <ComicCard
          key={comic.id}
          comic={comic}
          onBookmark={onBookmark ? () => onBookmark(comic.id) : undefined}
          isBookmarked={bookmarkedComics.includes(comic.id)}
        />
      ))}
    </div>
  );
}
