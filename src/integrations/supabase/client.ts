import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://dzmfdfvundfxyejcunix.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bWZkZnZ1bmRmeHllamN1bml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTk2NDcsImV4cCI6MjA4OTE5NTY0N30.THUutzgFmXckgRAi4omRkMzxKrcuCTY8n2LKgoi540o';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
