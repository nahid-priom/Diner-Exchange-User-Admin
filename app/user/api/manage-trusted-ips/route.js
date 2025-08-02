import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { extractIPAddress } from '../../../../lib/ipUtils';

/**
 * GET /user/api/manage-trusted-ips
 * Returns user's trusted IPs and auto-login settings
 */
export async function GET(request) {
  try {
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const user = await User.findById(authToken).select('email trustedIPs autoLoginEnabled lastLoginIP');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get current IP for comparison
    const currentIP = extractIPAddress(request);

    // Format trusted IPs for frontend
    const formattedTrustedIPs = (user.trustedIPs || []).map(ip => ({
      id: ip._id,
      ip: ip.ip,
      firstSeen: ip.firstSeen,
      lastUsed: ip.lastUsed,
      userAgent: ip.userAgent,
      location: ip.location,
      isCurrent: ip.ip === currentIP
    }));

    return NextResponse.json({
      autoLoginEnabled: user.autoLoginEnabled !== false,
      trustedIPs: formattedTrustedIPs,
      currentIP,
      lastLoginIP: user.lastLoginIP,
      totalTrustedIPs: formattedTrustedIPs.length
    });

  } catch (error) {
    console.error('Get trusted IPs error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve trusted IPs' },
      { status: 500 }
    );
  }
}

/**
 * POST /user/api/manage-trusted-ips
 * Manage trusted IPs and auto-login settings
 */
export async function POST(request) {
  try {
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { action, ipId, autoLoginEnabled } = await request.json();

    await connectDB();
    
    let user = await User.findById(authToken);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'toggle_auto_login':
        // Toggle auto-login feature on/off
        user.autoLoginEnabled = autoLoginEnabled;
        await user.save();
        
        return NextResponse.json({
          message: `Auto-login ${autoLoginEnabled ? 'enabled' : 'disabled'}`,
          autoLoginEnabled: user.autoLoginEnabled
        });

      case 'remove_ip':
        // Remove specific trusted IP
        if (!ipId) {
          return NextResponse.json(
            { error: 'IP ID is required' },
            { status: 400 }
          );
        }

        const initialCount = user.trustedIPs.length;
        user.trustedIPs = user.trustedIPs.filter(ip => ip._id.toString() !== ipId);
        
        if (user.trustedIPs.length === initialCount) {
          return NextResponse.json(
            { error: 'Trusted IP not found' },
            { status: 404 }
          );
        }

        await user.save();
        
        return NextResponse.json({
          message: 'Trusted IP removed successfully',
          remainingCount: user.trustedIPs.length
        });

      case 'clear_all_ips':
        // Remove all trusted IPs
        const removedCount = user.trustedIPs.length;
        user.trustedIPs = [];
        await user.save();
        
        return NextResponse.json({
          message: `All ${removedCount} trusted IPs cleared`,
          removedCount
        });

      case 'regenerate_magic_key':
        // Regenerate magic key (forces re-authentication)
        const crypto = require('crypto');
        user.magicKey = crypto.randomBytes(32).toString('hex');
        await user.save();
        
        return NextResponse.json({
          message: 'Magic key regenerated. All existing magic links are now invalid.'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Manage trusted IPs error:', error);
    return NextResponse.json(
      { error: 'Failed to manage trusted IPs' },
      { status: 500 }
    );
  }
}