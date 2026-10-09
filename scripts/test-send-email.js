require('dotenv').config();

/**
 * Exchanges Gmail OAuth refresh token for an access token.
 */
async function getGmailAccessToken(clientId, clientSecret, refreshToken) {
  console.log('[Gmail] Requesting access token using refresh token...');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(`Failed to refresh Gmail access token: ${JSON.stringify(data)}`);
  }

  console.log(`[Gmail] Access token successfully acquired (expires in ${data.expires_in}s).`);
  return data.access_token;
}

/**
 * Creates a base64url-encoded RFC 2822 email message.
 */
function createRawEmail({ to, subject, htmlBody, from = 'me' }) {
  const boundary = `----=_Part_${Date.now()}`;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?utf-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`,
    'MIME-Version: 1.0',
    `Content-Type: text/html; charset="UTF-8"`,
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody
  ];

  const rawMessage = lines.join('\r\n');
  return Buffer.from(rawMessage, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends an email using Gmail REST API.
 */
async function sendGmail({ to, subject, htmlBody }) {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = (process.env.GMAIL_REFRESH_TOKEN || process.env.Riddhi_GMAIL_TOKEN || '').trim();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Gmail credentials in .env (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, or GMAIL_REFRESH_TOKEN/Riddhi_GMAIL_TOKEN)');
  }

  const accessToken = await getGmailAccessToken(clientId, clientSecret, refreshToken);

  const raw = createRawEmail({ to, subject, htmlBody });

  console.log(`[Gmail] Sending email to ${to}...`);
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Gmail API send failed: ${JSON.stringify(result)}`);
  }

  console.log('✅ [Gmail] Email sent successfully!');
  console.log(`   Message ID: ${result.id}`);
  console.log(`   Thread ID:  ${result.threadId}`);
  return result;
}

// Execute test send
async function runTest() {
  const to = 'jimit@tatvic.com';
  const subject = 'Test Mail: sGTM Speed & Performance Estimation Automation';
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 20px; border-radius: 8px; color: white; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700;">sGTM Performance & Speed Automation</h2>
        <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Automated Email Integration Verification</p>
      </div>
      
      <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hi Jimit,</p>
      <p style="color: #334155; font-size: 15px; line-height: 1.5;">This is a test email sent from the <strong>Server-Side GTM Performance & Speed Estimation</strong> platform using the configured Gmail API OAuth integration.</p>
      
      <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 18px 0; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; color: #1e293b; font-weight: 600; font-size: 14px;">Integration Status: Verified</p>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">OAuth refresh token exchange and Gmail REST API message dispatch passed successfully.</p>
      </div>

      <p style="color: #64748b; font-size: 13px; margin-top: 24px;">Timestamp: ${new Date().toISOString()}</p>
    </div>
  `;

  try {
    await sendGmail({ to, subject, htmlBody });
  } catch (err) {
    console.error('❌ Error executing Gmail send test:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  runTest();
}

module.exports = { sendGmail, getGmailAccessToken, createRawEmail };
