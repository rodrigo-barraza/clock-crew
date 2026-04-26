# Clock Crew

Community website for [clock-crew.com](https://clock-crew.com) — celebrating the legacy of Flash animation and the iconic clock characters.

## Getting Started

```bash
cp .env.example .env    # configure local overrides
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on configured port |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with Prettier |
| `npm run deploy` | Build & deploy to Synology NAS |
| `npm run deploy:dry` | Dry-run deploy |

## Configuration

Secrets are resolved in priority order:

1. `process.env` — manual env vars, Docker `--env`
2. `.env` — project-level local overrides
3. Vault service — production secret server
4. `../vault/.env` — shared fallback for offline dev

See `.env.example` for available overrides.
