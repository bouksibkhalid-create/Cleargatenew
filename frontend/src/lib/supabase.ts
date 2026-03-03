import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tpuohkvbtpnrlfqrxrai.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdW9oa3ZidHBucmxmcXJ4cmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTYyNTUsImV4cCI6MjA4NTk3MjI1NX0.r-99Zhle2-PL2WCba9r5-A8ouuU12eYrry7A4cCBJ_E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
