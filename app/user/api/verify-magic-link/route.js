import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';


export async function POST(request) {
  try {
    const { magicKey } = await request.json();

    if (!magicKey) {
      return NextResponse.json({ error: 'Magic key is required' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ magicKey });
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired magic link' }, { status: 401 });
    }

    // Invalidate magic key (one-time use)
    user.magicKey = undefined;
    await user.save();

    const userInfo = {
      id: user._id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const response = NextResponse.json(
      { message: 'Login successful', user: userInfo },
      { status: 200 }
    );

    // Set auth cookie (secure, httpOnly)
    response.cookies.set('auth-token', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
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

// GET: Check authentication status via auth cookie
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(authToken).select('-magicKey');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userInfo = {
      id: user._id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json(
      { authenticated: true, user: userInfo },
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
