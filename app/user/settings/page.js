'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ipSettings, setIpSettings] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadSettings();
  }, []);

  const checkAuthAndLoadSettings = async () => {
    try {
      // Check authentication
      const authResponse = await fetch('/user/api/verify-magic-link', {
        method: 'GET',
      });

      if (!authResponse.ok) {
        router.push('/user/login');
        return;
      }

      const authData = await authResponse.json();
      setUser(authData.user);

      // Load IP settings
      const ipResponse = await fetch('/user/api/manage-trusted-ips', {
        method: 'GET',
      });

      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        setIpSettings(ipData);
      }
    } catch (error) {
      console.error('Settings load error:', error);
      router.push('/user/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutoLogin = async () => {
    if (!ipSettings) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/user/api/manage-trusted-ips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle_auto_login',
          autoLoginEnabled: !ipSettings.autoLoginEnabled,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIpSettings(prev => ({
          ...prev,
          autoLoginEnabled: data.autoLoginEnabled
        }));
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Toggle auto-login error:', error);
      toast.error('Failed to update auto-login setting');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveIP = async (ipId) => {
    if (!confirm('Are you sure you want to remove this trusted IP? You will need to use a magic link to log in from this IP address again.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/user/api/manage-trusted-ips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'remove_ip',
          ipId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh settings
        await checkAuthAndLoadSettings();
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Failed to remove IP');
      }
    } catch (error) {
      console.error('Remove IP error:', error);
      toast.error('Failed to remove trusted IP');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearAllIPs = async () => {
    if (!confirm('Are you sure you want to remove ALL trusted IPs? This will require magic link authentication for all future logins.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/user/api/manage-trusted-ips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clear_all_ips',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await checkAuthAndLoadSettings();
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Failed to clear IPs');
      }
    } catch (error) {
      console.error('Clear IPs error:', error);
      toast.error('Failed to clear trusted IPs');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRegenerateMagicKey = async () => {
    if (!confirm('Are you sure you want to regenerate your magic key? All existing magic links will become invalid.')) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/user/api/manage-trusted-ips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'regenerate_magic_key',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Failed to regenerate magic key');
      }
    } catch (error) {
      console.error('Regenerate key error:', error);
      toast.error('Failed to regenerate magic key');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin mx-auto h-8 w-8 text-indigo-600 mb-4">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white shadow-xl rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Account Settings
                </h1>
                <p className="text-gray-600">
                  Manage your auto-login preferences and trusted devices
                </p>
              </div>
              <button
                onClick={() => router.push('/user/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Auto-Login Settings */}
          <div className="bg-white shadow-xl rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Auto-Login Settings</h2>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <h3 className="font-medium text-gray-900">IP-Based Auto-Login</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Automatically log in from trusted IP addresses without requiring magic links
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={ipSettings?.autoLoginEnabled || false}
                  onChange={handleToggleAutoLogin}
                  disabled={isUpdating}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Current IP:</strong> {ipSettings?.currentIP}</p>
              <p><strong>Last Login IP:</strong> {ipSettings?.lastLoginIP || 'N/A'}</p>
            </div>
          </div>

          {/* Trusted IPs */}
          <div className="bg-white shadow-xl rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Trusted IP Addresses ({ipSettings?.totalTrustedIPs || 0})
              </h2>
              {ipSettings?.trustedIPs?.length > 0 && (
                <button
                  onClick={handleClearAllIPs}
                  disabled={isUpdating}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  Clear All
                </button>
              )}
            </div>

            {ipSettings?.trustedIPs?.length > 0 ? (
              <div className="space-y-4">
                {ipSettings.trustedIPs.map((ip) => (
                  <div
                    key={ip.id}
                    className={`p-4 rounded-lg border ${
                      ip.isCurrent 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{ip.ip}</h3>
                          {ip.isCurrent && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <p><strong>First seen:</strong> {new Date(ip.firstSeen).toLocaleString()}</p>
                          <p><strong>Last used:</strong> {new Date(ip.lastUsed).toLocaleString()}</p>
                          {ip.userAgent && (
                            <p><strong>Device:</strong> {ip.userAgent.substring(0, 100)}...</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveIP(ip.id)}
                        disabled={isUpdating}
                        className="ml-4 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium py-1 px-3 rounded transition-colors disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="mx-auto h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-gray-500">No trusted IP addresses yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Use magic link login to add your current IP as trusted
                </p>
              </div>
            )}
          </div>

          {/* Security Actions */}
          <div className="bg-white shadow-xl rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Security Actions</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">Regenerate Magic Key</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Invalidate all existing magic links and generate a new permanent key
                    </p>
                  </div>
                  <button
                    onClick={handleRegenerateMagicKey}
                    disabled={isUpdating}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Security Information</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Auto-login uses IP address matching for convenience</li>
                  <li>• Rate limiting prevents brute force attacks (5 attempts per 5 minutes)</li>
                  <li>• Maximum 10 trusted IPs per account</li>
                  <li>• Subnet matching allows for dynamic IP scenarios</li>
                  <li>• You can disable auto-login for high-security requirements</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}