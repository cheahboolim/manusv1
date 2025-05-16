import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/storage';

/**
 * This file contains test routes to validate the connections between
 * Next.js, Supabase, and Storj. These routes can be used to verify
 * that all integrations are working correctly.
 */

// Test database connection
export async function GET(request: NextRequest) {
  try {
    // Test Supabase connection by querying the health endpoint
    const { data, error } = await supabase.from('_health').select('*').limit(1);
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database connection failed', 
        error: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      data
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'An unexpected error occurred', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Test file upload to Storj (this would be called from a client-side form)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: 'No file provided' 
      }, { status: 400 });
    }
    
    // Test Storj connection by uploading a file
    const result = await uploadFile(file, 'test-uploads');
    
    return NextResponse.json({ 
      success: true, 
      message: 'File upload successful',
      url: result.url,
      key: result.key
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'File upload failed', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
