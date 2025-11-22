import { NextRequest, NextResponse } from 'next/server';
import { countryRequestDb } from '@/app/lib/db';

// Create a country request
export async function POST(request: NextRequest) {
  try {
    const { email, country } = await request.json();

    if (!email || !country) {
      return NextResponse.json(
        { error: 'Email and country are required' },
        { status: 400 }
      );
    }

    const countryRequest = await countryRequestDb.createRequest(email, country);

    return NextResponse.json({
      success: true,
      message: `Thank you for your interest! We'll add support for ${country} soon and notify you.`,
      request: countryRequest,
    });
  } catch (error) {
    console.error('Error creating country request:', error);
    return NextResponse.json(
      { error: 'Failed to create country request' },
      { status: 500 }
    );
  }
}
