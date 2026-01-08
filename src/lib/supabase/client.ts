import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    console.error(
      `[Supabase Client] Missing environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.\n' +
      'Restart your dev server after updating .env.local'
    );
    
    throw new Error(
      `Missing Supabase environment variables: ${missing.join(', ')}. ` +
      'Check .env.local and restart the dev server.'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

