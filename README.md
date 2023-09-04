# osu! news lemmy
A bot for checking the [osu! news](https://osu.ppy.sh/home/news) feed for new entries and automatically post it to a [Lemmy](https://join-lemmy.org) community.

The bot is actively used in my community at [!osu@reddthat.com](https://reddthat.com/c/osu)

## Install
```sh
$ git clone https://github.com/ravener/osu-news-lemmy
$ cd osu-news-lemmy
$ cp .env.example .env
# Fill out these fields.
$ nano .env
# Install dependencies
$ pnpm install
# Start the bot
$ node index.js
```
The bot will keep polling for changes every 12 hours and any new entries added since then will be posted to the specified instance and community.

