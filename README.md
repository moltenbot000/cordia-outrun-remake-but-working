# Neon Outrun Racer

Static browser-only retro racing game with a driver POV canvas, opponent traffic,
collision damage, speed, distance, status, and score stats.

## Structure

- `public/index.html` - game markup and deploy entry point
- `public/global.css` - global styling
- `src/app.ts` - typed browser game source
- `public/app.js` - compiled browser game logic
- `tests/app-state.test.mjs` - deterministic race-state tests
- `public/_redirects` - Cloudflare Pages SPA fallback
- `public/_headers` - basic static security headers

## Run Locally

Install dependencies, compile TypeScript, then serve the `public` folder with any static file server:

```sh
npm install
npm run build
python3 -m http.server 4173 --directory public
```

Then open `http://localhost:4173`.

## Deploy On Cloudflare Pages

Deploy with Wrangler:

```sh
npm run deploy
```

Or use these project settings in the Cloudflare Pages dashboard:

- Build command: `npm run build`
- Build output directory: `public`

This project does not require bundling or server functions.
