import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/context/auth';
import { createUserComic, addComicPage } from '@/lib/supabase/database';
import { uploadComicCover, uploadComicPage } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Comic Upload Page
 * 
 * Provides a multi-step interface for uploading comics with drag-and-drop functionality
 */
export default function ComicUploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Comic data
  const [comicId] = useState(uuidv4());
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [comicPages, setComicPages] = useState<File[]>([]);
  const [pagePreviewUrls, setPagePreviewUrls] = useState<string[]>([]);
  
  // Comic metadata
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('English');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Drag and drop refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      router.push('/sign-in?redirect=/dashboard/comics/upload');
    }
  }, [user, router]);
  
  // Handle cover image upload
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file for the cover');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Cover image must be less than 2MB');
        return;
      }
      
      setCoverImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setError(null);
    }
  };
  
  // Handle comic pages upload
  const handlePagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Check if adding these files would exceed the 100 page limit
      if (comicPages.length + files.length > 100) {
        setError(`You can only upload up to 100 pages. You're trying to add ${files.length} more pages to your existing ${comicPages.length} pages.`);
        return;
      }
      
      // Validate file types and sizes
      const invalidFiles = Array.from(files).filter(file => !file.type.startsWith('image/'));
      if (invalidFiles.length > 0) {
        setError('All files must be images');
        return;
      }
      
      const oversizedFiles = Array.from(files).filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setError('All images must be less than 5MB');
        return;
      }
      
      // Add new files to existing pages
      const newPages = [...comicPages, ...Array.from(files)];
      setComicPages(newPages);
      
      // Create previews for new files
      const newPreviews = Array.from(files).map(file => {
        const reader = new FileReader();
        return new Promise<string>((resolve) => {
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(newPreviews).then(previews => {
        setPagePreviewUrls([...pagePreviewUrls, ...previews]);
      });
      
      setError(null);
    }
  };
  
  // Handle drag and drop for page reordering
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };
  
  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };
  
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    // Make copies of the arrays
    const pagesCopy = [...comicPages];
    const previewsCopy = [...pagePreviewUrls];
    
    // Get the dragged items
    const draggedPage = pagesCopy[dragItem.current];
    const draggedPreview = previewsCopy[dragItem.current];
    
    // Remove the dragged items from the arrays
    pagesCopy.splice(dragItem.current, 1);
    previewsCopy.splice(dragItem.current, 1);
    
    // Insert the dragged items at the new positions
    pagesCopy.splice(dragOverItem.current, 0, draggedPage);
    previewsCopy.splice(dragOverItem.current, 0, draggedPreview);
    
    // Update the state
    setComicPages(pagesCopy);
    setPagePreviewUrls(previewsCopy);
    
    // Reset the refs
    dragItem.current = null;
    dragOverItem.current = null;
  };
  
  // Handle page removal
  const handleRemovePage = (index: number) => {
    const newPages = [...comicPages];
    const newPreviews = [...pagePreviewUrls];
    
    newPages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setComicPages(newPages);
    setPagePreviewUrls(newPreviews);
  };
  
  // Handle tag selection
  const handleTagToggle = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };
  
  // Navigate to next step
  const goToNextStep = () => {
    // Validate current step
    if (currentStep === 1 && !coverImage) {
      setError('Please upload a cover image');
      return;
    }
    
    if (currentStep === 2 && comicPages.length === 0) {
      setError('Please upload at least one comic page');
      return;
    }
    
    if (currentStep === 3) {
      if (!title.trim()) {
        setError('Please enter a title');
        return;
      }
      if (!artist.trim()) {
        setError('Please enter an artist name');
        return;
      }
    }
    
    setCurrentStep(currentStep + 1);
    setError(null);
  };
  
  // Navigate to previous step
  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1);
    setError(null);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!user) return;
    
    // Final validation
    if (!title.trim() || !artist.trim() || !coverImage || comicPages.length === 0) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Generate slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      
      // 1. Upload cover image
      const { url: coverUrl, error: coverError } = await uploadComicCover(
        user.id,
        comicId,
        coverImage
      );
      
      if (coverError) throw new Error('Failed to upload cover image');
      
      // 2. Create comic in database
      const { comic, error: comicError } = await createUserComic({
        user_id: user.id,
        title,
        slug: `${slug}-${Date.now().toString().slice(-6)}`, // Add timestamp to ensure uniqueness
        description,
        artist,
        cover_image_url: coverUrl || '',
        language,
        page_count: comicPages.length,
        status: 'published'
      });
      
      if (comicError) throw new Error('Failed to create comic');
      
      // 3. Upload comic pages
      for (let i = 0; i < comicPages.length; i++) {
        const { url: pageUrl, error: pageError } = await uploadComicPage(
          user.id,
          comicId,
          i + 1,
          comicPages[i]
        );
        
        if (pageError) throw new Error(`Failed to upload page ${i + 1}`);
        
        // Add page to database
        await addComicPage({
          comic_id: comicId,
          page_number: i + 1,
          image_url: pageUrl || ''
        });
      }
      
      // 4. Add tags
      if (selectedTags.length > 0 && comic) {
        // This would be handled by a separate function to add tags to the comic
        // For now, we'll just log it
        console.log('Adding tags:', selectedTags, 'to comic:', comic.id);
      }
      
      // Success! Redirect to manage comics page
      setSuccess('Comic uploaded successfully!');
      
      // Wait a moment to show success message, then redirect
      setTimeout(() => {
        router.push('/dashboard/comics');
      }, 2000);
      
    } catch (err) {
      console.error('Error uploading comic:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload comic');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Mock tags for the UI
  const availableTags = [
    { id: '1', name: 'Action', color: '#e74c3c' },
    { id: '2', name: 'Adventure', color: '#3498db' },
    { id: '3', name: 'Comedy', color: '#1abc9c' },
    { id: '4', name: 'Drama', color: '#f39c12' },
    { id: '5', name: 'Fantasy', color: '#9b59b6' },
    { id: '6', name: 'Horror', color: '#2d3436' },
    { id: '7', name: 'Mystery', color: '#6c5ce7' },
    { id: '8', name: 'Romance', color: '#e84393' },
    { id: '9', name: 'Sci-Fi', color: '#00cec9' },
    { id: '10', name: 'Slice of Life', color: '#fd79a8' },
    { id: '11', name: 'Sports', color: '#2ecc71' },
    { id: '12', name: 'Supernatural', color: '#636e72' }
  ];
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Upload Comic</h1>
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                1
              </div>
              <div className="ml-2">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Cover Image</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Upload cover art</div>
              </div>
            </div>
            
            <div className={`flex-grow border-t-2 mx-4 ${
              currentStep > 1 ? 'border-blue-600' : 'border-gray-200 dark:border-gray-700'
            }`}></div>
            
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                2
              </div>
              <div className="ml-2">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Comic Pages</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Upload & arrange pages</div>
              </div>
            </div>
            
            <div className={`flex-grow border-t-2 mx-4 ${
              currentStep > 2 ? 'border-blue-600' : 'border-gray-200 dark:border-gray-700'
            }`}></div>
            
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                3
              </div>
              <div className="ml-2">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Details</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Add metadata</div>
              </div>
            </div>
            
            <div className={`flex-grow border-t-2 mx-4 ${
              currentStep > 3 ? 'border-blue-600' : 'border-gray-200 dark:border-gray-700'
            }`}></div>
            
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                4
              </div>
              <div className="ml-2">
                <div className="text-sm font-medium text-gray-900 dark:text-white">Review</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Publish comic</div>
              </div>
            </div>
          </div>
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
          {/* Step 1: Cover Image Upload */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upload Cover Image</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This will be the main image displayed for your comic. Choose an eye-catching cover to attract readers.
              </p>
              
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-full md:w-1/2">
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    coverPreview ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {coverPreview ? (
                      <div className="relative">
                        <img 
                          src={coverPreview} 
                          alt="Cover Preview" 
                          className="mx-auto max-h-80 rounded"
                        />
                        <button
                          onClick={() => {
                            setCoverImage(null);
                            setCoverPreview(null);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                          aria-label="Remove cover image"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-64 cursor-pointer">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="mt-2 text-gray-600 dark:text-gray-400">Click to upload cover image</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleCoverUpload} 
                          className="hidden" 
                        />
                      </label>
                    )}
                  </div>
                </div>
                
                <div className="w-full md:w-1/2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Cover Image Guidelines</h3>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
                    <li>Use high-quality images with good resolution</li>
                    <li>Recommended aspect ratio is 2:3 (portrait)</li>
                    <li>Maximum file size: 2MB</li>
                    <li>Supported formats: JPG, PNG, WebP</li>
                    <li>Avoid text in the cover image</li>
                    <li>Make sure you have the rights to use the image</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Comic Pages Upload */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upload Comic Pages</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Upload up to 100 pages for your comic. You can drag and drop to reorder them.
              </p>
              
              <div className="mb-6">
                <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                  comicPages.length > 0 ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'
                }`}>
                  <label className="flex flex-col items-center justify-center h-32 cursor-pointer">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="mt-2 text-gray-600 dark:text-gray-400">
                      {comicPages.length > 0 
                        ? `${comicPages.length} pages selected. Click to add more (${100 - comicPages.length} remaining)`
                        : 'Click to upload comic pages'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handlePagesUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>
              
              {comicPages.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Arrange Pages ({comicPages.length})
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Drag and drop to reorder pages. The reading order will be from left to right, top to bottom.
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {pagePreviewUrls.map((preview, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className="relative group border rounded-lg overflow-hidden cursor-move"
                      >
                        <img 
                          src={preview} 
                          alt={`Page ${index + 1}`} 
                          className="w-full aspect-[2/3] object-cover"
                        />
                        <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white px-2 py-1 text-xs rounded-br">
                          {index + 1}
                        </div>
                        <button
                          onClick={() => handleRemovePage(index)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Remove page ${index + 1}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 3: Comic Details */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Comic Details</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add information about your comic to help readers find and enjoy it.
              </p>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter comic title"
                  />
                </div>
                
                <div>
                  <label htmlFor="artist" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Artist <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="artist"
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter artist name"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter a description of your comic"
                  />
                </div>
                
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="English">English</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          selectedTags.includes(tag.id)
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                        style={{
                          backgroundColor: selectedTags.includes(tag.id) ? tag.color + '33' : undefined,
                          color: selectedTags.includes(tag.id) ? tag.color : undefined
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Review and Publish */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Review and Publish</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Review your comic details before publishing.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Comic Preview</h3>
                  
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    {coverPreview && (
                      <img 
                        src={coverPreview} 
                        alt="Cover Preview" 
                        className="w-full max-h-80 object-contain mb-4 rounded"
                      />
                    )}
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Title:</span>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h4>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Artist:</span>
                        <p className="text-gray-900 dark:text-white">{artist}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Language:</span>
                        <p className="text-gray-900 dark:text-white">{language}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Pages:</span>
                        <p className="text-gray-900 dark:text-white">{comicPages.length}</p>
                      </div>
                      
                      {selectedTags.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tags:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedTags.map(tagId => {
                              const tag = availableTags.find(t => t.id === tagId);
                              return tag ? (
                                <span
                                  key={tag.id}
                                  className="px-2 py-0.5 rounded-full text-xs"
                                  style={{
                                    backgroundColor: tag.color + '33',
                                    color: tag.color
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      
                      {description && (
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Description:</span>
                          <p className="text-gray-900 dark:text-white whitespace-pre-line">{description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Page Preview</h3>
                  
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 h-[400px] overflow-y-auto">
                    <div className="grid grid-cols-3 gap-2">
                      {pagePreviewUrls.slice(0, 9).map((preview, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={preview} 
                            alt={`Page ${index + 1}`} 
                            className="w-full aspect-[2/3] object-cover rounded"
                          />
                          <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white px-2 py-0.5 text-xs rounded-br">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                      
                      {pagePreviewUrls.length > 9 && (
                        <div className="relative flex items-center justify-center bg-gray-300 dark:bg-gray-600 rounded aspect-[2/3]">
                          <span className="text-gray-700 dark:text-gray-200 font-medium">
                            +{pagePreviewUrls.length - 9} more
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h4 className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">Before Publishing</h4>
                    <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 text-sm space-y-1">
                      <li>Make sure all information is correct</li>
                      <li>Verify that pages are in the correct order</li>
                      <li>Ensure you have the rights to publish this content</li>
                      <li>Once published, your comic will be visible to all users</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            {currentStep > 1 ? (
              <button
                onClick={goToPreviousStep}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
                         text-gray-800 dark:text-white font-medium rounded-md transition-colors"
              >
                Previous
              </button>
            ) : (
              <div></div> // Empty div to maintain flex spacing
            )}
            
            {currentStep < 4 ? (
              <button
                onClick={goToNextStep}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Publish Comic'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
