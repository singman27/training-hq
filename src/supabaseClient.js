import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oqapomjzbkzzqvawrdmp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYXBvbWp6Ymt6enF2YXdyZG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMzkyMDUsImV4cCI6MjA4ODYxNTIwNX0.q4qNDxTfAg5NQdmM0Cfu5sfxcCJW6abI-DfmFNDfnks';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
