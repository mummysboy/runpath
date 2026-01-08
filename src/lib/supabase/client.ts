import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    const isProduction = typeof window !== 'undefined' && 
      (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
    
    const errorMessage = isProduction
      ? `Missing Supabase environment variables: ${missing.join(', ')}. Please configure these in your hosting platform's environment variables settings. See PRODUCTION_DEPLOYMENT.md for details.`
      : `Missing Supabase environment variables: ${missing.join(', ')}. Check .env.local and restart the dev server.`;
    
    console.error(
      `[Supabase Client] ${errorMessage}\n` +
      'Environment variables must be set in your hosting platform for production deployments.'
    );
    
    throw new Error(errorMessage);
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

