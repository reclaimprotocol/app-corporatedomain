import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { otpDb } from '@/app/lib/otp-model';
import { userDb } from '@/app/lib/db';

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Get stored OTP from MongoDB
    const storedOtp = await otpDb.getOTP(email);

    if (!storedOtp) {
      return NextResponse.json(
        { error: 'OTP not found or expired' },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (new Date() > new Date(storedOtp.expiresAt)) {
      await otpDb.deleteOTP(email);
      return NextResponse.json(
        { error: 'OTP expired' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (storedOtp.code === otp) {
      // Delete used OTP
      await otpDb.deleteOTP(email);

      // Create or update user in database
      await userDb.upsertUser(email);

      // Generate JWT token
      const token = await new SignJWT({ email })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(jwtSecret);

      return NextResponse.json({
        success: true,
        token,
        email,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
