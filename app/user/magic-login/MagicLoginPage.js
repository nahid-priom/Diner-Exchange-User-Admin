'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function MagicLoginPage() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyMagicLink = async () => {
      const magicKey = searchParams.get('key');

      if (!magicKey) {
        setError('Invalid magic link. No key provided.');
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch('/user/api/verify-magic-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ magicKey }),
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
          toast.success('Login successful! Welcome back.');
          
          // Redirect to dashboard or home page after a short delay
          setTimeout(() => {
            router.push('/user/dashboard'); // Change this to your desired redirect path
          }, 2000);
        } else {
          setError(data.error || 'Authentication failed');
          toast.error(data.error || 'Authentication failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setError('Network error. Please try again.');
        toast.error('Network error. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyMagicLink();
  }, [searchParams, router]);

  const handleRetryLogin = () => {
    router.push('/user/login');
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white shadow-xl rounded-lg p-8">
            <div className="animate-spin mx-auto h-12 w-12 text-indigo-600 mb-6">
              <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying your login...
            </h2>
            <p className="text-gray-600">
              Please wait while we authenticate your magic link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white shadow-xl rounded-lg p-8">
            <div className="mx-auto h-12 w-12 text-red-600 mb-6">
              <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <button
              onClick={handleRetryLogin}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try logging in again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white shadow-xl rounded-lg p-8">
            <div className="mx-auto h-12 w-12 text-green-600 mb-6">
              <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back!
            </h2>
            <p className="text-gray-600 mb-4">
              You have been successfully logged in as:
            </p>
            <p className="text-lg font-medium text-indigo-600 mb-6">
              {user.email}
            </p>
            <p className="text-sm text-gray-500">
              Redirecting you to your dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}