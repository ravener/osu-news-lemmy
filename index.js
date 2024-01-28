import 'dotenv/config';
import { LemmyHttp } from 'lemmy-js-client';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { setTimeout } from 'node:timers/promises';
import { fetchNews } from './osu.js';
import log from './log.js';

const client = new LemmyHttp(process.env.INSTANCE);
const jwt = await login();

client.setHeaders({
  'Authorization': `Bearer ${jwt}`
});

let community_id;

log.info(`Checking for the community '${process.env.COMMUNITY}' on instance '${process.env.INSTANCE}'`);

try {
  const community = await client.getCommunity({
    auth: jwt,
    name: process.env.COMMUNITY
  });
  const { id } = community.community_view.community;
  community_id = id;
  log.info(`Found community with ID ${id}`);
} catch (err) {
  log.error('Failed to fetch community, are you sure it exists?', err);
}

async function login() {
  // read from cache first
  if (existsSync('lemmy.token')) {
    log.info('Using Lemmy token from cached file.');
    return readFileSync('lemmy.token', 'utf8');
  }

  log.info('Logging in to lemmy with credentials.');
  const { jwt } = await client.login({
    username_or_email: process.env.USERNAME,
    password: process.env.PASSWORD
  });

  // cache token
  writeFileSync('lemmy.token', jwt);
  log.info('Login Successful, token cached for re-use.');
  return jwt;
}

function getLastUpdate() {
  if (existsSync('last_update.json')) {
    const { date } = JSON.parse(readFileSync('last_update.json'));
    return new Date(date);
  }

  // If this is the first time we are running the program
  // try to set a good default so it doesn't just
  // go crazy and post the entire feed.
  // Let's say we check for news for the last 3 days to begin with.
  return new Date() - 86400000 * 3;
}



async function getLatestNews() {
  const { news_posts } = await fetchNews();
  const last = getLastUpdate();

  // Update the timestamp to current date.
  writeFileSync('last_update.json', JSON.stringify({ date: new Date() }));

  // Filter for new posts since our last checked time.
  return news_posts
    .filter(post => new Date(post.published_at) > last)
    .reverse();
}

async function postNews(news) {
  log.info(`Posting news for '${news.title}'`);

  await client.createPost({
    auth: jwt,
    community_id,
    name: news.title,
    url: `https://osu.ppy.sh/home/news/${news.slug}`
  });
}

while (true) {
  log.info('Checking for updates...');

  try {
    const news = await getLatestNews();

    for (const post of news) {
      await postNews(post);
      // give it a break between posts.
      await setTimeout(30 * 1000);
    }
  } catch (err) {
    log.error('Failed to check for updates.', err);
  }

  // check every 12 hours.
  await setTimeout(12 * 60 * 60 * 1000);
}
