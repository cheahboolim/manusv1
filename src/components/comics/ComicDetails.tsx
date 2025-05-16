import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Genre } from '@/lib/supabase/database';

type GenreTagProps = {
  genre: Genre;
  size?: 'sm' | 'md' | 'lg';
};

/**
 * GenreTag Component
 * 
 * Displays a single genre tag with appropriate styling.
 * Used in comic details and filtering interfaces.
 */
export function GenreTag({ genre, size = 'md' }: GenreTagProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };
  
  return (
    <Link 
      href={`/genre/${genre.slug}`}
      className={`inline-block ${sizeClasses[size]} rounded-full font-medium transition-colors`}
      style={{ 
        backgroundColor: `${genre.color}20`, // 20% opacity
        color: genre.color,
        borderColor: genre.color,
        borderWidth: '1px'
      }}
    >
      {genre.name}
    </Link>
  );
}

type GenreTagsProps = {
  genres: Genre[];
  size?: GenreTagProps['size'];
};

/**
 * GenreTags Component
 * 
 * Displays a collection of genre tags.
 * Used in comic details and filtering interfaces.
 */
export function GenreTags({ genres, size }: GenreTagsProps) {
  if (!genres || genres.length === 0) {
    return null;
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {genres.map(genre => (
        <GenreTag key={genre.id} genre={genre} size={size} />
      ))}
    </div>
  );
}

type ComicHeaderProps = {
  title: string;
  coverImage?: string;
  author: {
    id: string;
    name: string;
  };
  publicationDate?: string;
  genres?: Genre[];
  status?: 'ongoing' | 'completed' | 'hiatus';
};

/**
 * ComicHeader Component
 * 
 * Displays the header section of a comic detail page, including
 * title, cover image, author, publication date, and genres.
 */
export function ComicHeader({ 
  title, 
  coverImage, 
  author, 
  publicationDate, 
  genres = [],
  status = 'ongoing'
}: ComicHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-8">
      {/* Cover Image */}
      <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
        <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-lg">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <svg
                className="w-24 h-24 text-gray-400 dark:text-gray-500"
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
        </div>
      </div>
      
      {/* Comic Info */}
      <div className="flex-grow">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h1>
        
        <div className="mb-4">
          <Link 
            href={`/author/${author.id}`}
            className="text-lg text-blue-600 dark:text-blue-400 hover:underline"
          >
            {author.name}
          </Link>
          {publicationDate && (
            <span className="text-gray-600 dark:text-gray-400 ml-4">
              {new Date(publicationDate).toLocaleDateString(undefined, { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          )}
        </div>
        
        {/* Status Badge */}
        <div className="mb-4">
          {status === 'ongoing' && (
            <span className="inline-block px-3 py-1 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-md">
              Ongoing
            </span>
          )}
          {status === 'completed' && (
            <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md">
              Completed
            </span>
          )}
          {status === 'hiatus' && (
            <span className="inline-block px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-md">
              Hiatus
            </span>
          )}
        </div>
        
        {/* Genres */}
        {genres.length > 0 && (
          <div className="mb-6">
            <GenreTags genres={genres} />
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Link 
            href={`/comic/${title.toLowerCase().replace(/\s+/g, '-')}/read`}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Start Reading
          </Link>
          <button
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-md transition-colors"
          >
            <svg
              className="w-5 h-5 inline-block mr-1"
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
            Bookmark
          </button>
        </div>
      </div>
    </div>
  );
}

type ChapterListProps = {
  chapters: {
    id: string;
    title: string;
    chapterNumber: number;
    isPremium: boolean;
    publishedAt: string;
  }[];
  comicSlug: string;
  currentChapterId?: string;
};

/**
 * ChapterList Component
 * 
 * Displays a list of chapters for a comic with links to read each chapter.
 * Used in comic details page.
 */
export function ChapterList({ chapters, comicSlug, currentChapterId }: ChapterListProps) {
  if (!chapters || chapters.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">No chapters available yet.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {chapters.map(chapter => (
        <div 
          key={chapter.id}
          className={`p-4 rounded-lg border ${
            chapter.id === currentChapterId 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          } transition-colors`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Chapter {chapter.chapterNumber}: {chapter.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(chapter.publishedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Link
                href={`/comic/${comicSlug}/chapter/${chapter.id}`}
                className={`px-4 py-1.5 rounded-md font-medium ${
                  chapter.isPremium 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                }`}
              >
                {chapter.isPremium ? (
                  <>
                    <svg
                      className="w-4 h-4 inline-block mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 8l-3.293-3.293A1 1 0 0112 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Premium
                  </>
                ) : 'Read'}
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

type ComicDescriptionProps = {
  description: string;
};

/**
 * ComicDescription Component
 * 
 * Displays the description of a comic with proper formatting.
 * Used in comic details page.
 */
export function ComicDescription({ description }: ComicDescriptionProps) {
  if (!description) {
    return null;
  }
  
  // Split description into paragraphs
  const paragraphs = description.split('\n').filter(p => p.trim() !== '');
  
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}

type ComicPreviewProps = {
  previewImages: string[];
  comicSlug: string;
};

/**
 * ComicPreview Component
 * 
 * Displays preview images for a comic with a "Start Reading" button.
 * Used in comic details page.
 */
export function ComicPreview({ previewImages, comicSlug }: ComicPreviewProps) {
  if (!previewImages || previewImages.length === 0) {
    return null;
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Preview</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {previewImages.map((image, index) => (
          <div key={index} className="aspect-[3/4] relative rounded-lg overflow-hidden shadow-md">
            <Image
              src={image}
              alt={`Preview ${index + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <Link
          href={`/comic/${comicSlug}/read`}
          className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          Start Reading
        </Link>
      </div>
    </div>
  );
}

type CommentSectionProps = {
  comments: {
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      username: string;
      avatarUrl?: string;
    };
  }[];
  onAddComment: (content: string) => void;
  isLoggedIn: boolean;
};

/**
 * CommentSection Component
 * 
 * Displays comments for a comic and allows users to add new comments.
 * Used in comic details page.
 */
export function CommentSection({ comments, onAddComment, isLoggedIn }: CommentSectionProps) {
  const [newComment, setNewComment] = React.useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Comments</h2>
      
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              required
            />
          </div>
          <div className="text-right">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            Please sign in to leave a comment.
          </p>
          <Link
            href="/sign-in"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Sign In
          </Link>
        </div>
      )}
      
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden">
                  {comment.user.avatarUrl ? (
                    <Image
                      src={comment.user.avatarUrl}
                      alt={comment.user.username}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-400">
                      {comment.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-grow">
                <div className="flex items-center mb-1">
                  <span className="font-medium text-gray-900 dark:text-white mr-2">
                    {comment.user.username}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-200">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
