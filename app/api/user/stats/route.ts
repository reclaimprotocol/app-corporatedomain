import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/app/lib/db';
import { sendEmail, createDomainNotLinkedEmail } from '@/app/lib/email';

// Calculate Levenshtein distance between two strings
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[len1][len2];
}

// Get a human-readable description of the differences between two domains
function getDomainDifference(original: string, similar: string): string {
  const differences: string[] = [];

  // Simple character-by-character comparison
  let i = 0, j = 0;
  while (i < original.length || j < similar.length) {
    if (i >= original.length) {
      differences.push(`+${similar[j]}`);
      j++;
    } else if (j >= similar.length) {
      differences.push(`-${original[i]}`);
      i++;
    } else if (original[i] === similar[j]) {
      i++;
      j++;
    } else {
      // Check if it's a substitution, insertion, or deletion
      if (i + 1 < original.length && original[i + 1] === similar[j]) {
        differences.push(`-${original[i]}`);
        i++;
      } else if (j + 1 < similar.length && original[i] === similar[j + 1]) {
        differences.push(`+${similar[j]}`);
        j++;
      } else {
        differences.push(`${original[i]}→${similar[j]}`);
        i++;
        j++;
      }
    }
  }

  return differences.join(', ');
}

export async function GET(request: NextRequest) {
  try {
    const searchedEmail = request.nextUrl.searchParams.get('email');
    const searcherEmail = request.nextUrl.searchParams.get('searcherEmail');

    if (!searchedEmail) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const domainName = searchedEmail.split('@')[1];
    if (!domainName) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // 1. Get exact email match
    const exactMatch = await userDb.getUserByEmail(searchedEmail);

    // 2. Get stats for the exact domain
    const domainStats = await userDb.getEmployerStatsByDomain(domainName);

    // 3. Check if domain has no data and send email
    if (domainStats.length === 0 && searcherEmail) {
      const searcherDomain = searcherEmail.split('@')[1];
      if (searcherDomain) {
        const emailContent = createDomainNotLinkedEmail(searchedEmail, searcherDomain);
        // Send email asynchronously (don't wait for it)
        sendEmail({
          to: searchedEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        }).catch(error => {
          console.error('Failed to send email notification:', error);
        });
      }
    }

    // 4. Get similar domains (within 4 character difference)
    const allDomains = await userDb.getAllDomains();
    const similarDomains = allDomains
      .filter(domain => {
        if (domain === domainName) return false;
        const distance = levenshteinDistance(domainName, domain);
        return distance > 0 && distance < 4;
      })
      .sort();

    // Get stats for each similar domain
    const similarDomainsStats = await Promise.all(
      similarDomains.map(async (domain) => ({
        domain,
        difference: getDomainDifference(domainName, domain),
        stats: await userDb.getEmployerStatsByDomain(domain),
      }))
    );

    return NextResponse.json({
      exactMatch: exactMatch ? { email: exactMatch.email, employer: exactMatch.employer } : null,
      domainStats,
      similarDomainsStats,
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    return NextResponse.json(
      { error: 'Failed to get employer statistics' },
      { status: 500 }
    );
  }
}
