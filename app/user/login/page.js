"use client";

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setIsLoading(true);

    try {
      // 1. Check for auto-login
      const res = await fetch('/user/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.autoLoggedIn) {
        toast.success("Welcome back! You're logged in automatically from a trusted device.");
        setEmail('');
        setTimeout(() => router.push('/user/dashboard'), 800);
        return;
      }

      // 2. Fallback: Send magic link
      const magicRes = await fetch('/user/api/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const magicData = await magicRes.json();
      if (magicRes.ok) {
        toast.success('Magic link sent! Check your email.');
        setEmail('');
      } else {
        toast.error(magicData.error || 'Something went wrong');
      }
    } catch (error) {
      toast.error('Failed to log in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-lg p-8 max-w-md w-full space-y-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 text-center">Sign in</h2>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          placeholder="Enter your email"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Login or Send Magic Link'}
        </button>
      </form>
    </div>
  );
}
