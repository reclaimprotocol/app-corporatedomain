// Email sending utility using AWS SES
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  try {
    // Send email via AWS SES
    const emailParams = {
      Source: process.env.AWS_SES_FROM_EMAIL!,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
          ...(text && {
            Text: {
              Data: text,
              Charset: 'UTF-8',
            },
          }),
        },
      },
    };

    const command = new SendEmailCommand(emailParams);
    await sesClient.send(command);

    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export function createDomainNotLinkedEmail(
  searchedEmail: string,
  searcherDomain: string
): { subject: string; html: string; text: string } {
  const searchedDomain = searchedEmail.split('@')[1];

  const subject = `Action Needed: Domain Verification for ${searchedDomain}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #2563eb; color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px 20px; }
    .content p { margin: 0 0 15px 0; }
    .highlight { background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
    .cta-container { text-align: center; margin: 30px 0; }
    .cta { background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; display: inline-block; border-radius: 6px; font-weight: 600; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 13px; color: #666; border-top: 1px solid #e5e7eb; }
    .footer a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Action Needed: Domain Verification for ${searchedDomain}</h1>
    </div>
    <div class="content">
      <p>Hi,</p>
      <p>A user from <strong>${searcherDomain}</strong> searched for your email address on our corporate domain verification platform.</p>

      <div class="highlight">
        <strong>Your company domain (${searchedDomain}) is not verified yet.</strong><br>
        You can be the first person to link this domain to your employer.
      </div>

      <p>What is this?</p>
      <p>Reclaim Protocol's Corporate Domain Verification allows professionals to verify which company they work for. When you verify your domain, anyone searching for ${searchedDomain} addresses will see your verified employer information.</p>

      <p>Benefits:</p>
      <ul>
        <li>Link your corporate email to your employer</li>
        <li>Help colleagues verify your company affiliation</li>
        <li>Increase trust in business communications</li>
      </ul>

      <div class="cta-container">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}" class="cta" style="color: #ffffff; text-decoration: none;">Verify Your Domain</a>
      </div>
    </div>
    <div class="footer">
      <p>Sent by Reclaim Protocol. This is a one-time notification.</p>
      <p><a href="https://reclaimprotocol.org">Learn more about Reclaim Protocol</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Action Needed: Domain Verification for ${searchedDomain}

Hi,

A user from ${searcherDomain} searched for your email address on our corporate domain verification platform.

Your company domain (${searchedDomain}) is not verified yet. You can be the first person to link this domain to your employer.

What is this?
Reclaim Protocol's Corporate Domain Verification allows professionals to verify which company they work for. When you verify your domain, anyone searching for ${searchedDomain} addresses will see your verified employer information.

Benefits:
- Link your corporate email to your employer
- Help colleagues verify your company affiliation
- Increase trust in business communications

Verify your domain: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}

Sent by Reclaim Protocol. This is a one-time notification.
Learn more: https://reclaimprotocol.org
  `.trim();

  return { subject, html, text };
}
