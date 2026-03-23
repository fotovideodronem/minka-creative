import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ysnwurduyfgymxtcfnhp.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzbnd1cmR1eWZneW14dGNmbmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMxMjgxNCwiZXhwIjoyMDg1ODg4ODE0fQ.mn9GcNlvrbd_PH2oeTZnVo6JIVL7ydhK9JAxZOpJGIE';

export const supabase = createClient(supabaseUrl, supabaseKey);