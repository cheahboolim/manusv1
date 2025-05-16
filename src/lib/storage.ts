import AWS from 'aws-sdk';

/**
 * Storj S3 storage utility for handling image uploads and downloads.
 * This module provides a clean interface for interacting with Storj's S3-compatible storage,
 * making it easy to manage images and other files in your application.
 */

// Configure the AWS SDK to use Storj's S3-compatible endpoint
const s3 = new AWS.S3({
  endpoint: process.env.STORJ_ENDPOINT,
  accessKeyId: process.env.STORJ_ACCESS_KEY,
  secretAccessKey: process.env.STORJ_SECRET_KEY,
  s3ForcePathStyle: true, // Required for S3-compatible services
  signatureVersion: 'v4',
});

const BUCKET_NAME = process.env.STORJ_BUCKET || '';

/**
 * Uploads a file to Storj S3 storage
 * @param file The file to upload (from input element or File API)
 * @param path Optional path/folder within the bucket
 * @returns The URL of the uploaded file
 */
export async function uploadFile(
  file: File,
  path: string = ''
): Promise<{ url: string; key: string }> {
  // Generate a unique file name to prevent collisions
  const timestamp = Date.now();
  const fileName = file.name.replace(/\s+/g, '-').toLowerCase();
  const key = path ? `${path}/${timestamp}-${fileName}` : `${timestamp}-${fileName}`;
  
  // Convert file to buffer for upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Upload to Storj
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: file.type,
    ACL: 'public-read', // Make the file publicly accessible
  };
  
  await s3.upload(params).promise();
  
  // Construct the public URL
  const url = `${process.env.STORJ_ENDPOINT}/${BUCKET_NAME}/${key}`;
  
  return { url, key };
}

/**
 * Retrieves a file from Storj S3 storage
 * @param key The key (path) of the file to retrieve
 * @returns The file data as a buffer
 */
export async function getFile(key: string): Promise<Buffer> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  };
  
  const { Body } = await s3.getObject(params).promise();
  return Body as Buffer;
}

/**
 * Deletes a file from Storj S3 storage
 * @param key The key (path) of the file to delete
 */
export async function deleteFile(key: string): Promise<void> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  };
  
  await s3.deleteObject(params).promise();
}

/**
 * Lists files in a directory in Storj S3 storage
 * @param prefix The directory prefix to list
 * @returns Array of file keys and their metadata
 */
export async function listFiles(prefix: string = ''): Promise<AWS.S3.ObjectList> {
  const params = {
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  };
  
  const { Contents } = await s3.listObjects(params).promise();
  return Contents || [];
}

/**
 * Generates a pre-signed URL for temporary access to a file
 * @param key The key (path) of the file
 * @param expiresIn Expiration time in seconds (default: 60 minutes)
 * @returns Pre-signed URL with temporary access
 */
export function getSignedUrl(key: string, expiresIn: number = 3600): string {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresIn,
  };
  
  return s3.getSignedUrl('getObject', params);
}

/**
 * Helper function to convert a File object to a Buffer
 * This is useful when working with file inputs in the browser
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
