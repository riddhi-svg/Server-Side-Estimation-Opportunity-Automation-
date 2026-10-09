let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Exchanges Gmail OAuth refresh token for an access token with in-memory caching.
 */
async function getValidGmailAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && tokenExpiresAt > now + 60000) {
    return cachedAccessToken;
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = (process.env.GMAIL_REFRESH_TOKEN || process.env.Riddhi_GMAIL_TOKEN || '').trim();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Gmail credentials in environment (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, or GMAIL_REFRESH_TOKEN)');
  }

  console.log('[GmailClient] Refreshing Gmail OAuth access token...');
  let response;
  let data;
  let lastErr;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });
      data = await response.json();
      if (response.ok && data.access_token) break;
    } catch (err) {
      lastErr = err;
      if (attempt < 3) await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (!response?.ok || !data?.access_token) {
    throw new Error(`Failed to refresh Gmail access token: ${JSON.stringify(data || lastErr?.message)}`);
  }

  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + ((data.expires_in || 3600) * 1000);
  console.log(`[GmailClient] Acquired access token. Valid for ${data.expires_in}s`);
  return cachedAccessToken;
}

/**
 * Creates a base64url-encoded RFC 2822 email message.
 */
function createRawEmail({ to, cc, subject, htmlBody, from = 'me' }) {
  const lines = [
    `From: ${from}`,
    `To: ${to}`
  ];

  if (cc && typeof cc === 'string' && cc.trim()) {
    lines.push(`Cc: ${cc.trim()}`);
  }

  lines.push(
    `Subject: =?utf-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody
  );

  return Buffer.from(lines.join('\r\n'), 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends an email using Gmail REST API.
 */
async function sendRawEmail({ to, cc, subject, htmlBody }) {
  const accessToken = await getValidGmailAccessToken();
  const raw = createRawEmail({ to, cc, subject, htmlBody });

  console.log(`[GmailClient] Dispatching email to ${to}${cc ? ` (cc: ${cc})` : ''}...`);
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

  console.log(`[GmailClient] Email successfully sent (Message ID: ${result.id})`);
  return result;
}

module.exports = {
  getValidGmailAccessToken,
  createRawEmail,
  sendRawEmail
};
