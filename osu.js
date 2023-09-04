import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import log from './log.js';

const URL = 'https://osu.ppy.sh/oauth/token';
const USER_AGENT = 'osu-news-lemmy https://github.com/ravener/osu-news-lemmy';
let cachedToken;

/**
 * Fetches the access token for the osu!web API
 * Implements a cache to store it in memory and persist it in a file.
 * Automatically tracks expiration and requests a new token.
 */
async function getToken() {
  if (cachedToken || existsSync('osu.json')) {
    cachedToken ??= JSON.parse(readFileSync('osu.json'));
    const { mtime } = statSync('osu.json');

    if (Date.now() - mtime < cachedToken.expires_in * 1000) {
      log.info('Found cached osu! token');
      return cachedToken.access_token;
    }

    log.info('Cached osu! token is expired requesting new token.');
  }

  log.info('Requesting osu! api credentials grant.');
  const response = await fetch(URL, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'public'
    })
  });

  if (response.status !== 200) {
    throw new Error(`Got status code ${response.status}`);
  }

  const token = await response.json();
  writeFileSync('osu.json', JSON.stringify(token, null, 2));
  cachedToken = token.access_token;
  return token.access_token;
}

async function request(endpoint) {
  const token = await getToken();

  const response = await fetch(`https://osu.ppy.sh/api/v2${endpoint}`, {
    headers: {
      'User-Agent': USER_AGENT,
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch news: ${response.status}`);
  }

  return response.json();
}

export function fetchNews() {
  return request('/news');
}
