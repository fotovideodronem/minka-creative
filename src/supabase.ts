import { createClient } from '@supabase/supabase-js';

// Tyto klíče najdeš v Supabase: Settings -> API
const supabaseUrl = 'https://tvuj-projekt.supabase.co';
const supabaseAnonKey = 'tvuj-dlouhy-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);