import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { extractIPAddress, addTrustedIP, recordLoginAttempt } from '../../../../lib/ipUtils';

export async function POST(request) {
  try {
    const { magicKey } = await request.json();

    // Validate magic key
    if (!magicKey) {
      return NextResponse.json(
        { error: 'Magic key is required' },
        { status: 400 }
      );
    }

    // Extract IP address and user agent for tracking
    const userIP = extractIPAddress(request);
    const userAgent = request.headers.get('user-agent');

    // Connect to MongoDB
    await connectDB();

    // Find user by magic key
    let user = await User.findOne({ magicKey });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired magic link' },
        { status: 401 }
      );
    }

    // IP-based enhancement: Add current IP to trusted IPs on successful magic link login
    console.log(`Magic link login successful for ${user.email} from IP ${userIP}`);
    
    // Add/update trusted IP and record successful login
    addTrustedIP(user, userIP, userAgent);
    recordLoginAttempt(user, true);
    
    // Save updated user data
    await user.save();

    // Return user info (excluding sensitive data)
    const userInfo = {
      id: user._id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Create response with user data
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        user: userInfo,
        newTrustedIP: userIP, // Inform frontend that this IP is now trusted
        autoLoginEnabled: user.autoLoginEnabled !== false
      },
      { status: 200 }
    );

    // Set a simple session cookie (you can make this more sophisticated)
    response.cookies.set('auth-token', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Verify magic link error:', error);
    
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}

// Optional: Add GET method to check authentication status
export async function GET(request) {
  try {
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Find user by ID
    const user = await User.findById(authToken).select('-magicKey');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user info
    const userInfo = {
      id: user._id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json(
      { 
        authenticated: true,
        user: userInfo
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Authentication check error:', error);
    
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}