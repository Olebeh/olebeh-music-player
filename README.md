# Olebeh Music Player
A fast and productive music player library for [discord.js](https://discord.js.org)

[![downloadsBadge](https://img.shields.io/npm/dt/olebeh-music-player?style=for-the-badge)](https://npmjs.com/olebeh-music-player)
[![versionBadge](https://img.shields.io/npm/v/olebeh-music-player?label=Version&style=for-the-badge)](https://npmjs.com/olebeh-music-player)

## Installation

### Install [olebeh-music-player](https://npmjs.org/olebeh-music-player)

```sh
$ npm install --save olebeh-music-player
```

### Install [@discordjs/opus](https://npmjs.org/@discordjs/opus)

```sh
$ npm install --save @discordjs/opus
```

> **NOTE**: You still need some common libraries, like [discord.js](https://discord.js.org) in order to make your bot

### Install FFmpeg
- As an application: **[https://www.ffmpeg.org/download.html](https://www.ffmpeg.org/download.html)** (recommended)

- As an NPM module: **[https://npmjs.com/package/ffmpeg-static](https://npmjs.com/package/ffmpeg-static)**

# Features
- Beginner friendly 🆕
- Very simple usage ✅
- Fast and productive 🥇
- Can be used on many servers at time 🌆
- Very flexible, provides full control on what is streamed right now ✨

## Get started

First of all, choose your language specification: TypeScript or JavaScript. TypeScript is highly recommended for use

### Let's build a very simple bot to play music in voice channel
Use these links to view examples for TypeScript or JavaScript:
- [TypeScript](https://github.com/Olebeh/olebeh-music-player/tree/master/examples/index.ts)
- [JavaScript](https://github.com/Olebeh/olebeh-music-player/tree/master/examples/index.js)

## Supported apps

For now, Olebeh Music Player only supports YouTube, Spotify and direct link to media files. Spotify is only available if [you will provide your Spotify's app credentials](https://github.com/Olebeh/olebeh-music-player#more-options)

## More options

### Porviding apps credentials
Fetching data from Spotify only available if you have own Spotify app. It can be created easily following [this tutorial](https://github.com/play-dl/play-dl/tree/main/instructions)

#### Providing your credential to the Player

```ts
const player = new Player(client, {
  authorization: {
    youtube: {
      cookie: 'YOUR_YOUTUBE_COOKIE'
    },
    spotify: {
      client_id: 'CLIENT_ID'
      client_secret: 'CLIENT_SECRET'
      refresh_token: 'REFRESH_TOKEN'
      market: 'MARKET'
    }
  }
})
```

#### Obtaining required credentials

- For obtaining YouTube cookie, follow [this guide](https://github.com/play-dl/play-dl/tree/main/instructions#youtube-cookies)
- For obtaining Spotify credentials, follow [this guide](https://github.com/play-dl/play-dl/tree/main/instructions#spotify)

For now, that's it. Thanks for using this library, any issues can be reported [here](https://github.com/Olebeh/olebeh-music-player/issues)