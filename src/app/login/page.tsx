'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  // Check for error query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam === 'no_profile') {
      setError('Your account exists but needs to be set up. Please create your user profile in the database. See create_user_profile.sql for SQL commands.');
    } else if (errorParam === 'no_session') {
      setError('Session expired or invalid. Please log in again.');
    } else if (errorParam === 'profile_error') {
      setError('Error loading your profile. This might be an RLS (Row Level Security) issue. Please check the server console and run fix_rls_circular_dependency.sql in Supabase SQL Editor.');
    }
    
    // Debug: Check environment variables in production (only log, don't expose values)
    if (typeof window !== 'undefined') {
      const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      
      if (isProduction) {
        console.log('[Login Debug] Environment check:', {
          hasSupabaseUrl: hasUrl,
          hasSupabaseKey: hasKey,
          hostname: window.location.hostname,
        });
        
        if (!hasUrl || !hasKey) {
          console.error('[Login Debug] Missing environment variables! Check your hosting platform settings.');
        }
      }
    }
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      if (data.session) {
        console.log('[CLIENT] Login successful, session:', {
          user: data.user?.email,
          userId: data.user?.id,
          hasSession: !!data.session,
        });
        
        // Verify session is saved by checking cookies
        console.log('[CLIENT] Current cookies:', document.cookie);
        
        // Wait for cookies to be set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify session exists
        const { data: sessionCheck } = await supabase.auth.getSession();
        if (!sessionCheck.session) {
          console.error('[CLIENT] Session was not saved!');
          throw new Error('Session not persisted');
        }
        console.log('[CLIENT] Session verified, redirecting...');
        
        // Use window.location for full page reload
        window.location.href = '/app';
      } else {
        throw new Error('No session created');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      
      // Provide more helpful error messages
      let errorMessage = err.message || 'Failed to sign in. Please check your email and password.';
      
      // Check for common production issues
      if (err.message?.includes('Missing Supabase environment variables')) {
        errorMessage = 'Configuration error: Supabase credentials are missing. Please contact support.';
      } else if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (err.message?.includes('Session not persisted') || err.message?.includes('Session was not saved')) {
        errorMessage = 'Session could not be saved. This may be a cookie issue. Please try again or contact support.';
      } else if (err.message?.includes('fetch') || err.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: magicLinkEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
        },
      });

      if (error) throw error;

      setSuccess('Check your email for the magic link!');
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setSuccess('Check your email for the password reset link!');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f11] text-[#e8ecf2] flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-[520px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-2xl p-10 shadow-2xl">
        <div className="text-center mb-9">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/RunpathLabs_Logo-Combined_Reversed.png"
              alt="Runpath logo"
              width={200}
              height={60}
              className="h-24 w-auto mx-auto"
              priority
            />
          </Link>
          <h2 className="text-3xl font-semibold mb-2 text-[#f7f9ff]">Welcome Back</h2>
          <p className="text-[#b7c1cf] text-sm">
            Sign in to access your dashboard
          </p>
        </div>

        {!isMagicLink && !isPasswordReset ? (
          <>
            <div className="flex items-center my-8 text-center text-[#9eacc2] text-xs font-medium uppercase tracking-wider">
              <div className="flex-1 border-t border-[rgba(255,255,255,0.08)]"></div>
              <span className="px-4">Sign In</span>
              <div className="flex-1 border-t border-[rgba(255,255,255,0.08)]"></div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-5">
              {error && (
                <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg p-3">
                  <p className="text-[#f87171] text-sm">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-[#d6dbe5]">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)]"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2 text-[#d6dbe5]">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)]"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[#c8d2e2] cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-[#5ea0ff] cursor-pointer" />
                  <span>Remember me</span>
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsPasswordReset(true)}
                    className="text-[#5ea0ff] hover:text-[#8fc2ff]"
                  >
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMagicLink(true)}
                    className="text-[#5ea0ff] hover:text-[#8fc2ff]"
                  >
                    Use magic link instead
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </>
        ) : isPasswordReset ? (
          <>
            <div className="flex items-center my-8 text-center text-[#9eacc2] text-xs font-medium uppercase tracking-wider">
              <div className="flex-1 border-t border-[rgba(255,255,255,0.08)]"></div>
              <span className="px-4">Reset Password</span>
              <div className="flex-1 border-t border-[rgba(255,255,255,0.08)]"></div>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-5">
              {error && (
                <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg p-3">
                  <p className="text-[#f87171] text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] rounded-lg p-3">
                  <p className="text-[#4ade80] text-sm">{success}</p>
                </div>
              )}

              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium mb-2 text-[#d6dbe5]">
                  Email Address
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)]"
                />
              </div>

              <p className="text-sm text-[#9eacc2]">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordReset(false);
                    setError(null);
                    setSuccess(null);
                    setResetEmail('');
                  }}
                  className="text-[#5ea0ff] hover:text-[#8fc2ff]"
                >
                  Back to login
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center my-8 text-center text-[#9eacc2] text-xs font-medium uppercase tracking-wider">
              <div className="flex-1 border-t border-[rgba(255,255,255,0.08)]"></div>
              <span className="px-4">Magic Link</span>
              <div className="flex-1 border-t border-[rgba(255,255,255,0.08)]"></div>
            </div>

            <form onSubmit={handleMagicLink} className="space-y-5">
              {error && (
                <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg p-3">
                  <p className="text-[#f87171] text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] rounded-lg p-3">
                  <p className="text-[#4ade80] text-sm">{success}</p>
                </div>
              )}

              <div>
                <label htmlFor="magicLinkEmail" className="block text-sm font-medium mb-2 text-[#d6dbe5]">
                  Email Address
                </label>
                <input
                  id="magicLinkEmail"
                  type="email"
                  value={magicLinkEmail}
                  onChange={(e) => setMagicLinkEmail(e.target.value)}
                  required
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#f4f6fb] placeholder:text-[#7a8799] focus:outline-none focus:border-[rgba(94,160,255,0.5)] focus:bg-[rgba(255,255,255,0.07)]"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsMagicLink(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-[#5ea0ff] hover:text-[#8fc2ff]"
                >
                  Use password instead
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#2b80ff] to-[#45a6ff] text-[#0d0f11] font-semibold hover:shadow-lg hover:shadow-[rgba(43,128,255,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)] text-center text-sm text-[#9eacc2]">
          <p>Need help? <Link href="/contact" className="text-[#5ea0ff] hover:text-[#8fc2ff]">Contact support</Link></p>
        </div>
      </div>
    </div>
  );
}

