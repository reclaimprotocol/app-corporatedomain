import { verifyProof } from '@reclaimprotocol/js-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/app/lib/db';
import providers from '@/app/lib/providers.json';

export async function POST(request: NextRequest) {
  try {
    console.log('Received proof callback');

    // Get the raw body as text first
    const bodyText = await request.text();
    console.log('Raw body:', bodyText);

    let proofs;

    // Try to parse as JSON first
    try {
      proofs = JSON.parse(bodyText);
    } catch {
      // If that fails, try to decode URL-encoded data
      try {
        const decoded = decodeURIComponent(bodyText);
        proofs = JSON.parse(decoded);
      } catch {
        // If it's form-encoded, try to parse as form data
        const formData = new URLSearchParams(bodyText);
        const proofParam = formData.get('proof');
        if (proofParam) {
          proofs = JSON.parse(decodeURIComponent(proofParam));
        } else {
          throw new Error('Unable to parse proof data');
        }
      }
    }
    
    const proof = Array.isArray(proofs) ? proofs[0] : proofs;
    console.log("Proof:", proof);

    let context = JSON.parse(proof.claimData.context);
    let email = context.contextAddress;
    let contextMessage = context.contextMessage;

    console.log("Email:", email);
    console.log("ContextMessage:", contextMessage);

    // Parse contextMessage to get country and provider
    let contextData;
    try {
      contextData = JSON.parse(contextMessage);
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid context message format'
      }, { status: 400 });
    }

    const { country, provider } = contextData;
    console.log("Country:", country);
    console.log("Provider:", provider);

    if (!country || !provider) {
      return NextResponse.json({
        success: false,
        error: 'Country and provider are required in context'
      }, { status: 400 });
    }

    // Verify the proof (verifyProof expects an array)
    const proofsArray = Array.isArray(proofs) ? proofs : [proofs];
    const isValid = await verifyProof(proofsArray);
    console.log("IsValid:", isValid);

    if (!isValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid proof'
      }, { status: 400 });
    }

    // Look up the provider in providers.json
    let providerConfig;
    if (providers[country as keyof typeof providers]) {
      const countryProviders = providers[country as keyof typeof providers];
      providerConfig = Object.values(countryProviders).find((p: any) => p.id === provider);
    }

    if (!providerConfig && providers.ALL) {
      providerConfig = Object.values(providers.ALL).find((p: any) => p.id === provider);
    }

    if (!providerConfig) {
      return NextResponse.json({
        success: false,
        error: 'Provider configuration not found'
      }, { status: 400 });
    }

    // Get the jsonPath from provider config
    const jsonPath = (providerConfig as any).jsonPath;
    if (!jsonPath) {
      return NextResponse.json({
        success: false,
        error: 'Unable to verify your company - provider configuration missing jsonPath'
      }, { status: 400 });
    }

    // Helper function to resolve jsonPath with dot notation and array indexing
    const resolveJsonPath = (obj: any, path: string): any => {
      const parts = path.split('.');
      let current = obj;

      for (const part of parts) {
        if (!current) return undefined;

        // Handle array indexing like "employment[0]"
        const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
        if (arrayMatch) {
          const [, key, index] = arrayMatch;
          current = current[key];
          if (Array.isArray(current)) {
            current = current[parseInt(index, 10)];
          } else {
            return undefined;
          }
        } else {
          current = current[part];
        }
      }

      return current;
    };

    // Apply jsonPath to extractedParameters
    const extractedParameters = context.extractedParameters;
    const company = resolveJsonPath(extractedParameters, jsonPath);

    if (!company) {
      return NextResponse.json({
        success: false,
        error: 'Unable to verify your company - company information not found in proof'
      }, { status: 400 });
    }

    console.log("Company:", company);

    // Update user in database
    const user = await userDb.getUserByEmail(email);
    console.log("User:", user);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    await userDb.updateUserData(email, company, proofs);

    return NextResponse.json({
      success: true,
      message: 'Proof received and verified',
      company,
      proofs
    });
  } catch (error) {
    console.error('Error processing callback:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to process callback'
      },
      { status: 500 }
    );
  }
}
