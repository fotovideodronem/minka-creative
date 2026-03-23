import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vpsskbxtpqtotlyzszhy.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwb3N0dmNyeWNhdGVwbG9ldCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NzAzMTI4MjEsImV4cCI6MjA4NTg4ODgxMX0.XXXX';

export const supabase = createClient(supabaseUrl, supabaseKey);