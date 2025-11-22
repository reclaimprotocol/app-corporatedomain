import { NextRequest, NextResponse } from 'next/server';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';
import { jwtVerify } from 'jose';

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Get email, country, and provider from body
    const { email, country, provider } = await request.json();

    if (!email || !country || !provider) {
      return NextResponse.json(
        { error: 'Email, country, and provider are required' },
        { status: 400 }
      );
    }

    // Verify JWT token
    try {
      const { payload } = await jwtVerify(token, jwtSecret);

      // Check if token email matches provided email
      if (payload.email !== email) {
        return NextResponse.json(
          { error: 'Unauthorized: Token does not match email' },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('JWT verification failed:', error);
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }
    // Initialize SDK with server-side environment variables (secure)
    const reclaimProofRequest = await ReclaimProofRequest.init(
      process.env.RECLAIM_APP_ID!,
      process.env.RECLAIM_APP_SECRET!,
      provider
    );

    // Get base URL (Vercel sets this automatically in production)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    'http://localhost:3000');

    // Set callback URL with email, country, and provider as query params
    reclaimProofRequest.setAppCallbackUrl(`${baseUrl}/api/reclaim/callback?email=${encodeURIComponent(email)}&country=${encodeURIComponent(country)}&provider=${encodeURIComponent(provider)}`);
    reclaimProofRequest.addContext(email, JSON.stringify({country, provider}));
    const config = reclaimProofRequest.toJsonString();
    console.log("Config:", config);

    return NextResponse.json({
      success: true,
      reclaimProofRequestConfig: config
    });
  } catch (error) {
    console.error('Error generating config:', error);

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to generate config'
      },
      { status: 500 }
    );
  }
}
