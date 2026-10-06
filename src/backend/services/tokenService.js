let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Gets a valid Google Tag Manager access token.
 * Automatically refreshes the ENTERPRISE_TOKEN if configured in .env.
 */
async function getValidGtmAccessToken() {
  const now = Date.now();
  // Return cached token if still valid (with 60-second buffer)
  if (cachedAccessToken && tokenExpiresAt > now + 60000) {
    return cachedAccessToken;
  }

  const refreshToken = process.env.ENTERPRISE_TOKEN;
  const clientId = process.env.GTM_CLIENT_ID;
  const clientSecret = process.env.GTM_CLIENT_SECRET;

  if (refreshToken && clientId && clientSecret) {
    try {
      console.log('[TokenService] Refreshing Google OAuth access token from ENTERPRISE_TOKEN...');
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
      if (response.ok && data.access_token) {
        cachedAccessToken = data.access_token;
        tokenExpiresAt = Date.now() + ((data.expires_in || 3600) * 1000);
        console.log(`[TokenService] Successfully retrieved access token. Expires in ${data.expires_in}s`);
        return cachedAccessToken;
      } else {
        console.error('[TokenService] Failed to refresh token:', data);
      }
    } catch (err) {
      console.error('[TokenService] Error refreshing token:', err.message);
    }
  }

  return cachedAccessToken;
}

function setManualAccessToken(token) {
  cachedAccessToken = token;
  tokenExpiresAt = Date.now() + (3600 * 1000);
}

module.exports = {
  getValidGtmAccessToken,
  setManualAccessToken
};
