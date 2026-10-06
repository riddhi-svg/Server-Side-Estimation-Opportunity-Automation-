/**
 * GTM REST API Client
 */

const BASE_URL = 'https://tagmanager.googleapis.com/tagmanager/v2';

async function fetchGtmResource(endpointPath, token) {
  const response = await fetch(`${BASE_URL}${endpointPath}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error?.message || 'Failed to fetch GTM resource');
    error.statusCode = response.status;
    error.code = response.status === 401 ? 'TOKEN_EXPIRED' : 'API_ERROR';
    throw error;
  }
  return data;
}

module.exports = { fetchGtmResource };
