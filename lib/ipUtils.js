/**
 * IP Address Utilities for Auto-Login Enhancement
 * 
 * Security considerations:
 * - IP addresses can change frequently (mobile users, VPNs, dynamic IPs)
 * - Should be used as convenience feature, not primary security measure
 * - Rate limiting and account locking prevent abuse
 * - Users can disable auto-login for high-security accounts
 */

/**
 * Extract real IP address from request headers
 * Handles various proxy scenarios (Cloudflare, AWS ALB, nginx, etc.)
 * 
 * @param {NextRequest} request - Next.js request object
 * @returns {string} - Extracted IP address
 */
export function extractIPAddress(request) {
  // Priority order for IP detection (most reliable first)
  const ipHeaders = [
    'cf-connecting-ip',      // Cloudflare
    'x-real-ip',            // nginx proxy
    'x-forwarded-for',      // Standard proxy header
    'x-client-ip',          // Some proxies
    'x-cluster-client-ip',  // Cluster environments
    'x-forwarded',          // Legacy
    'forwarded-for',        // Legacy
    'forwarded'             // RFC 7239
  ];

  // Check each header in priority order
  for (const header of ipHeaders) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first (original client)
      const ip = value.split(',')[0].trim();
      if (isValidIP(ip)) {
        return ip;
      }
    }
  }

  // Fallback to direct connection IP
  const remoteAddress = request.ip || 
                       request.connection?.remoteAddress || 
                       request.socket?.remoteAddress ||
                       (request.connection?.socket ? request.connection.socket.remoteAddress : null);

  if (remoteAddress && isValidIP(remoteAddress)) {
    return remoteAddress;
  }

  // Last resort - return unknown but logged
  console.warn('Unable to extract valid IP address from request');
  return 'unknown';
}

/**
 * Validate if string is a valid IP address (IPv4 or IPv6)
 * 
 * @param {string} ip - IP address to validate
 * @returns {boolean} - True if valid IP
 */
export function isValidIP(ip) {
  if (!ip || typeof ip !== 'string') return false;
  
  // Remove any port numbers
  ip = ip.split(':')[0];
  
  // IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(ip)) {
    return true;
  }
  
  // IPv6 validation (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  if (ipv6Regex.test(ip)) {
    return true;
  }
  
  // IPv6 compressed notation
  const ipv6CompressedRegex = /^::1$|^::$|^([0-9a-fA-F]{1,4}::?)+[0-9a-fA-F]{1,4}$/;
  if (ipv6CompressedRegex.test(ip)) {
    return true;
  }
  
  return false;
}

/**
 * Check if IP is a private/local IP address
 * These IPs might be less reliable for auto-login due to NAT
 * 
 * @param {string} ip - IP address to check
 * @returns {boolean} - True if private IP
 */
export function isPrivateIP(ip) {
  if (!isValidIP(ip)) return false;
  
  // IPv4 private ranges
  const privateRanges = [
    /^127\./,                    // Loopback
    /^10\./,                     // Class A private
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // Class B private
    /^192\.168\./,               // Class C private
    /^169\.254\./,               // Link-local
    /^::1$/,                     // IPv6 loopback
    /^fc00:/,                    // IPv6 private
    /^fe80:/                     // IPv6 link-local
  ];
  
  return privateRanges.some(range => range.test(ip));
}

/**
 * Check if user's IP matches any trusted IPs
 * Implements fuzzy matching for dynamic IP scenarios
 * 
 * @param {string} currentIP - Current user IP
 * @param {Array} trustedIPs - Array of trusted IP objects
 * @returns {Object} - { isMatch: boolean, matchedIP: object|null }
 */
export function checkTrustedIP(currentIP, trustedIPs) {
  if (!currentIP || !trustedIPs || trustedIPs.length === 0) {
    return { isMatch: false, matchedIP: null };
  }

  // Exact match first (most reliable)
  const exactMatch = trustedIPs.find(trusted => trusted.ip === currentIP);
  if (exactMatch) {
    return { isMatch: true, matchedIP: exactMatch, matchType: 'exact' };
  }

  // Subnet matching for dynamic IPs (only for IPv4)
  if (isValidIP(currentIP) && currentIP.includes('.')) {
    const currentSubnet = currentIP.split('.').slice(0, 3).join('.');
    
    const subnetMatch = trustedIPs.find(trusted => {
      if (trusted.ip.includes('.')) {
        const trustedSubnet = trusted.ip.split('.').slice(0, 3).join('.');
        return currentSubnet === trustedSubnet;
      }
      return false;
    });
    
    if (subnetMatch) {
      // Only allow subnet matching if the last octet is within reasonable range
      const currentLastOctet = parseInt(currentIP.split('.')[3]);
      const trustedLastOctet = parseInt(subnetMatch.ip.split('.')[3]);
      const octetDiff = Math.abs(currentLastOctet - trustedLastOctet);
      
      // Allow difference of up to 20 in last octet (configurable)
      if (octetDiff <= 20) {
        return { isMatch: true, matchedIP: subnetMatch, matchType: 'subnet' };
      }
    }
  }

  return { isMatch: false, matchedIP: null };
}

/**
 * Add or update trusted IP for user
 * Implements security limits and cleanup
 * 
 * @param {Object} user - User document
 * @param {string} ip - IP address to add
 * @param {string} userAgent - Optional user agent
 * @returns {Object} - Updated user object
 */
export function addTrustedIP(user, ip, userAgent = null) {
  if (!user.trustedIPs) {
    user.trustedIPs = [];
  }

  // Check if IP already exists
  const existingIndex = user.trustedIPs.findIndex(trusted => trusted.ip === ip);
  
  if (existingIndex !== -1) {
    // Update existing IP
    user.trustedIPs[existingIndex].lastUsed = new Date();
    if (userAgent) {
      user.trustedIPs[existingIndex].userAgent = userAgent;
    }
  } else {
    // Add new IP
    const newTrustedIP = {
      ip,
      firstSeen: new Date(),
      lastUsed: new Date(),
      userAgent: userAgent || undefined
    };
    
    user.trustedIPs.push(newTrustedIP);
    
    // Limit to maximum 10 trusted IPs per user (security measure)
    if (user.trustedIPs.length > 10) {
      // Remove oldest unused IP
      user.trustedIPs.sort((a, b) => new Date(a.lastUsed) - new Date(b.lastUsed));
      user.trustedIPs = user.trustedIPs.slice(-10);
    }
  }
  
  // Update last login IP
  user.lastLoginIP = ip;
  
  return user;
}

/**
 * Security rate limiting check
 * Prevents abuse of auto-login feature
 * 
 * @param {Object} user - User document
 * @returns {Object} - { allowed: boolean, resetTime: Date|null }
 */
export function checkRateLimit(user) {
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  
  // Check if account is currently locked
  if (user.accountLocked && user.lockUntil && new Date() < user.lockUntil) {
    return { 
      allowed: false, 
      resetTime: user.lockUntil,
      reason: 'account_locked'
    };
  }
  
  // Reset if lockout period has expired
  if (user.accountLocked && user.lockUntil && new Date() >= user.lockUntil) {
    user.accountLocked = false;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
  }
  
  // Check recent attempts
  const recentAttemptWindow = 5 * 60 * 1000; // 5 minutes
  const isRecentAttempt = user.lastLoginAttempt && 
                         (new Date() - user.lastLoginAttempt) < recentAttemptWindow;
  
  if (isRecentAttempt && user.loginAttempts >= MAX_ATTEMPTS) {
    // Lock account
    user.accountLocked = true;
    user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION);
    
    return { 
      allowed: false, 
      resetTime: user.lockUntil,
      reason: 'rate_limited'
    };
  }
  
  return { allowed: true, resetTime: null };
}

/**
 * Record login attempt for rate limiting
 * 
 * @param {Object} user - User document
 * @param {boolean} successful - Whether login was successful
 * @returns {Object} - Updated user object
 */
export function recordLoginAttempt(user, successful = false) {
  user.lastLoginAttempt = new Date();
  
  if (successful) {
    // Reset on successful login
    user.loginAttempts = 0;
    user.accountLocked = false;
    user.lockUntil = undefined;
  } else {
    // Increment failed attempts
    user.loginAttempts = (user.loginAttempts || 0) + 1;
  }
  
  return user;
}