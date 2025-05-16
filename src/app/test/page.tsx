import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth';
import { fetchData } from '@/lib/database';
import { uploadFile, listFiles } from '@/lib/storage';

/**
 * This component tests all integrations between Next.js, Supabase, and Storj.
 * It validates database connections, authentication flow, and image upload/download.
 */
export default function TestIntegrations() {
  const { user, loading } = useAuth();
  const [dbStatus, setDbStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [dbMessage, setDbMessage] = useState('');
  const [storageStatus, setStorageStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [storageMessage, setStorageMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');

  // Test database connection
  const testDatabase = async () => {
    setDbStatus('loading');
    setDbMessage('Testing database connection...');
    
    try {
      const response = await fetch('/api/test');
      const result = await response.json();
      
      if (result.success) {
        setDbStatus('success');
        setDbMessage('Database connection successful!');
      } else {
        setDbStatus('error');
        setDbMessage(`Database connection failed: ${result.error}`);
      }
    } catch (error) {
      setDbStatus('error');
      setDbMessage(`Error testing database: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Test file upload to Storj
  const testFileUpload = async () => {
    if (!selectedFile) {
      setStorageStatus('error');
      setStorageMessage('Please select a file first');
      return;
    }
    
    setStorageStatus('loading');
    setStorageMessage('Uploading file to Storj...');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch('/api/test', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStorageStatus('success');
        setStorageMessage('File upload successful!');
        setUploadedFileUrl(result.url);
      } else {
        setStorageStatus('error');
        setStorageMessage(`File upload failed: ${result.error}`);
      }
    } catch (error) {
      setStorageStatus('error');
      setStorageMessage(`Error uploading file: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Integration Tests</h1>
      
      {/* Authentication Test */}
      <div className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Authentication Test</h2>
        {loading ? (
          <p className="text-gray-600">Loading authentication status...</p>
        ) : user ? (
          <div className="bg-green-100 p-4 rounded-md">
            <p className="text-green-700 font-medium">Authentication successful!</p>
            <p className="text-green-600 mt-2">Logged in as: {user.email}</p>
          </div>
        ) : (
          <div className="bg-yellow-100 p-4 rounded-md">
            <p className="text-yellow-700">Not authenticated. Please sign in to test authentication.</p>
          </div>
        )}
      </div>
      
      {/* Database Test */}
      <div className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Database Test</h2>
        <button
          onClick={testDatabase}
          disabled={dbStatus === 'loading'}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {dbStatus === 'loading' ? 'Testing...' : 'Test Database Connection'}
        </button>
        
        {dbStatus !== 'idle' && (
          <div className={`p-4 rounded-md ${
            dbStatus === 'loading' ? 'bg-blue-50 text-blue-700' :
            dbStatus === 'success' ? 'bg-green-100 text-green-700' :
            'bg-red-100 text-red-700'
          }`}>
            <p>{dbMessage}</p>
          </div>
        )}
      </div>
      
      {/* Storage Test */}
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Storage Test</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select a file to upload
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
        
        <button
          onClick={testFileUpload}
          disabled={!selectedFile || storageStatus === 'loading'}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {storageStatus === 'loading' ? 'Uploading...' : 'Test File Upload'}
        </button>
        
        {storageStatus !== 'idle' && (
          <div className={`p-4 rounded-md ${
            storageStatus === 'loading' ? 'bg-blue-50 text-blue-700' :
            storageStatus === 'success' ? 'bg-green-100 text-green-700' :
            'bg-red-100 text-red-700'
          }`}>
            <p>{storageMessage}</p>
            {uploadedFileUrl && (
              <p className="mt-2">
                <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  View uploaded file
                </a>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
