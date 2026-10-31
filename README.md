# IPTV Checker

A personal IPTV player for Android. Add your M3U playlist and the app checks which channels are actually live, lets you show only the online ones, and keeps re-checking in the background while the app is open.

## Try it on your phone (Expo Go, no build needed)

1. Install **Expo Go** from the Play Store.
2. Install Node.js 20 or newer on your computer.
3. In this folder run `npm install`, then `npx expo start`.
4. Scan the QR code with Expo Go. Phone and computer must be on the same Wi-Fi
   (if they can't be, use `npx expo start --tunnel`).

Edits to the code reload on the phone instantly.

## Build an APK to install permanently

1. Create a free account at expo.dev.
2. Run `npx eas-cli@latest login`, then `npx eas-cli@latest build -p android --profile preview`.
3. When the build finishes (about 10–15 minutes), open the link on your phone and install the APK.
   Android will ask you to allow installs from your browser the first time.

The APK build allows plain `http://` streams, which most IPTV providers use. Expo Go already allows them.

## How channel checking works

- **What "online" means.** HLS channels (`.m3u8`) are online when their playlist lists video segments; master playlists are followed to one variant. Other streams (raw MPEG-TS) are online when about 4 KB of video arrives. *Thorough check* in Settings also downloads the newest HLS segment.
- **Gentle on your account.** Only the first few KB are read, then the connection is closed. A small number of checks run at once (default 4, adjustable), and checking pauses while you watch so the player always gets the connection.
- **Order.** Channels on screen are checked first, then favorites, then the group you opened, then everything else.
- **No flicker.** An online channel needs two failed checks in a row before it shows as offline.
- **Auto-refresh.** Statuses older than the refresh interval (default 15 min) are re-checked every 30 seconds while the app is open. Android doesn't let apps do this reliably in the background, so out-of-date channels are re-checked as soon as you open a playlist.
- **The player counts too.** If a channel plays, it's marked online; if it fails, that counts as a failed check.
- Statuses and favorites are stored per stream address, so they survive playlist updates.

Statuses: **Online**, **Offline** (error, dead stream or web page instead of video), **Timed out**, **Refused** (401/403: login expired or region blocked), **Not checked**.

## Code map

- `src/lib/m3u.ts` playlist parser
- `src/lib/hls.ts` HLS manifest analysis
- `src/lib/probe.ts` single-channel check
- `src/lib/queue.ts` priority queue
- `src/lib/rules.ts` online/offline rules and freshness
- `src/lib/checker.ts` runs the queue, auto-refresh and saving
- `src/lib/db.ts` SQLite storage on the phone
- `src/screens/` Playlists, Channels, Player, Settings

## Tests

`npm test` runs 18 tests: parser, URL handling, manifest analysis, queue, status rules, and the prober against a local fake IPTV server (live TS stream, HLS master/variant, 403, HTML error page, redirects, hanging server). `npm run typecheck` checks types.

## Not in this version yet

Xtream Codes login, EPG / TV guide, Android TV remote navigation.
