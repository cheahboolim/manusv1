import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Database utility functions for interacting with Supabase.
 * These functions provide a clean interface for common database operations
 * while handling errors and providing type safety.
 */

/**
 * Fetches data from a specified table with optional filters
 * @param table The name of the table to fetch from
 * @param queryBuilder Optional function to customize the query
 * @returns The fetched data and any error that occurred
 */
export async function fetchData<T>(
  table: string,
  queryBuilder?: (query: any) => any
): Promise<{ data: T[] | null; error: PostgrestError | null }> {
  let query = supabase.from(table).select('*');
  
  if (queryBuilder) {
    query = queryBuilder(query);
  }
  
  const { data, error } = await query;
  return { data, error };
}

/**
 * Inserts a new record into a specified table
 * @param table The name of the table to insert into
 * @param data The data to insert
 * @returns The inserted data and any error that occurred
 */
export async function insertData<T>(
  table: string,
  data: Partial<T>
): Promise<{ data: T | null; error: PostgrestError | null }> {
  const { data: insertedData, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();
  
  return { data: insertedData as T, error };
}

/**
 * Updates a record in a specified table
 * @param table The name of the table to update
 * @param id The ID of the record to update
 * @param data The data to update
 * @returns The updated data and any error that occurred
 */
export async function updateData<T>(
  table: string,
  id: string | number,
  data: Partial<T>
): Promise<{ data: T | null; error: PostgrestError | null }> {
  const { data: updatedData, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  return { data: updatedData as T, error };
}

/**
 * Deletes a record from a specified table
 * @param table The name of the table to delete from
 * @param id The ID of the record to delete
 * @returns Any error that occurred during deletion
 */
export async function deleteData(
  table: string,
  id: string | number
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  
  return { error };
}
