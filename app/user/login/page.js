'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoLoginStatus, setAutoLoginStatus] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setAutoLoginStatus(null);

    try {
      const response = await fetch('/user/api/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.autoLogin) {
          // Auto-login successful based on trusted IP
          setAutoLoginStatus({
            type: 'success',
            message: `Welcome back! Auto-login from trusted IP (${data.ipMatch} match)`,
            user: data.user
          });
          
          toast.success('Auto-login successful! Redirecting...');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/user/dashboard');
          }, 1500);
        } else {
          // Normal magic link flow
          setAutoLoginStatus({
            type: 'magic-link',
            message: 'Magic link sent to your email',
            userIP: data.userIP
          });
          
          toast.success('Magic link sent! Check your email.');
          setEmail('');
        }
      } else {
        // Handle different error types
        if (response.status === 429) {
          setAutoLoginStatus({
            type: 'rate-limited',
            message: data.error
          });
          toast.error(data.error);
        } else {
          toast.error(data.error || 'Something went wrong');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to send magic link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email to receive a magic login link
          </p>
        </div>
        
        <div className="bg-white shadow-xl rounded-lg p-8">
          {/* Auto-login status display */}
          {autoLoginStatus && (
            <div className={`mb-6 p-4 rounded-lg border ${
              autoLoginStatus.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800'
                : autoLoginStatus.type === 'rate-limited'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {autoLoginStatus.type === 'success' ? (
                    <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : autoLoginStatus.type === 'rate-limited' ? (
                    <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    {autoLoginStatus.type === 'success' ? 'Auto-Login Successful!' :
                     autoLoginStatus.type === 'rate-limited' ? 'Account Temporarily Locked' :
                     'Magic Link Sent'}
                  </h3>
                  <p className="mt-1 text-sm">
                    {autoLoginStatus.message}
                  </p>
                  {autoLoginStatus.type === 'success' && autoLoginStatus.user && (
                    <p className="mt-2 text-sm font-medium">
                      Welcome back, {autoLoginStatus.user.email}!
                    </p>
                  )}
                  {autoLoginStatus.type === 'magic-link' && autoLoginStatus.userIP && (
                    <p className="mt-2 text-xs opacity-70">
                      Future logins from this IP ({autoLoginStatus.userIP}) will be automatic.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your email"
                  disabled={isLoading || autoLoginStatus?.type === 'success'}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || autoLoginStatus?.type === 'success'}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {autoLoginStatus?.type === 'success' ? 'Redirecting...' : 'Processing...'}
                  </span>
                ) : autoLoginStatus?.type === 'success' ? (
                  'Login Successful!'
                ) : (
                  'Send magic link'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {autoLoginStatus?.type === 'success' ? 'Auto-login enabled' : 'No passwords required'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            {autoLoginStatus?.type === 'success' 
              ? 'Your IP has been saved for future automatic logins.'
              : 'We\'ll send you a secure login link that never expires unless you regenerate it.'}
          </p>
          {!autoLoginStatus && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 font-medium mb-1">🚀 Auto-Login Feature</p>
              <p className="text-xs text-blue-600">
                After your first successful login, we'll remember your device and location for instant access on future visits.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
