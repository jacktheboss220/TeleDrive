# TeleDrive

Personal cloud storage that uses a private Telegram channel as the blob
store. Uses GramJS (MTProto, your own account) instead of the Bot API, so
there's no 50MB file-size cap. MongoDB holds the file index (metadata,
folders, tags); Telegram holds the actual bytes.

## Structure

Two independent projects, run separately:

```
backend/    Node/Express API - GramJS, MongoDB, JWT auth
frontend/   React/Vite SPA - talks to the backend over REST + SSE
```

Each has its own `package.json`, `.env`, and `node_modules`.

## Backend setup

```
cd backend
cp .env.example .env
```

Fill in `.env`:

| Var | Where to get it |
|---|---|
| `TG_API_ID` / `TG_API_HASH` | [my.telegram.org](https://my.telegram.org) → API development tools |
| `TG_SESSION` | run `npm run generate-session`, log in, paste the printed string |
| `TG_CHANNEL_ID` | numeric ID of your private channel, e.g. `-1001234567890` |
| `MONGO_URI` | local or Atlas connection string |
| `JWT_SECRET` | any random secret (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `AUTH_USERNAME` / `AUTH_PASSWORD` | login credentials for the single user |

```
npm install
npm run generate-session   # one-time, prints TG_SESSION
npm start                  # http://localhost:3000
```

## Frontend setup

```
cd frontend
npm install
npm run dev                # http://localhost:5173
```

`frontend/.env` has `VITE_API_URL` pointing at the backend (defaults to
`http://localhost:3000`).

## Docker (backend + Mongo)

```
docker compose up --build
```

Builds `backend/` and starts a local `mongo` alongside it. The frontend
isn't containerized - run it separately with `npm run dev` or serve
`frontend/dist` after `npm run build`.

## Features

- Upload (multipart, drag-and-drop, progress bar with live Telegram-send
  status), download, delete, rename, move, tag
- Multi-select with batch delete/move (batched into a single Telegram call)
- Thumbnails: images resized/cached with sharp; videos get a frame grabbed
  with ffmpeg at upload time
- Inline preview (image/video/audio/PDF), folders, search, filter by
  type/date/tag
- JWT auth with a per-IP login rate limit
- Retry/backoff on Telegram rate limits (FLOOD_WAIT) and transient errors

## Known limitations

- No Range/206 support on download, so video/audio scrubbing re-buffers
  from the start instead of seeking
- Video thumbnails only generate at upload time (need the local file before
  it's deleted) - already-uploaded videos won't retroactively get one
- Rename only updates the Telegram message caption, not the document's
  underlying filename attribute (MTProto limitation, immutable after upload)
