# Vendor Tracker — Frontend

Next.js UI for managing vendors against the AWS backend (API Gateway, Cognito, DynamoDB). Users sign up / sign in with Amazon Cognito via Amplify, then create, list, and delete vendors.

**Backend:** [littlegod20/vendor-tracking-aws-backend](https://github.com/littlegod20/vendor-tracking-aws-backend.git)

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Auth | [AWS Amplify](https://docs.amplify.aws/) + Cognito (`@aws-amplify/ui-react`) |
| Language | TypeScript |
| Deploy shape | Static export (`output: 'export'`) → `out/` for S3 + CloudFront |

## Project structure

```
frontend/
├── app/
│   ├── layout.tsx      # Root layout; wraps the app in <Providers>
│   ├── page.tsx        # Main vendor UI (gated by withAuthenticator)
│   ├── providers.tsx   # Amplify.configure (Cognito) at module load
│   └── globals.css
├── lib/
│   └── api.ts          # Authenticated fetch helpers for /vendors
├── types/
│   └── vendor.ts       # Vendor type
├── next.config.ts      # output: 'export' for static hosting
└── .env.local          # Public API + Cognito IDs (not committed)
```

## How it works

1. **`Providers`** loads on every page via `layout.tsx` and runs `Amplify.configure` with your Cognito User Pool ID and App Client ID.
2. **`page.tsx`** is wrapped with `withAuthenticator`. Unauthenticated users see Amplify’s built-in sign-in / sign-up UI.
3. After login, the page calls `lib/api.ts`, which:
   - Reads the Cognito **ID token** via `fetchAuthSession()`
   - Sends it as the `Authorization` header to API Gateway
4. API Gateway’s Cognito authorizer validates the token, then invokes the matching Lambda.

```
Browser → Amplify Auth (Cognito)
       → API Gateway (/vendors) + JWT
       → Lambda → DynamoDB
```

## Prerequisites

- Node.js 20+ recommended
- Backend stack already deployed (see `../backend/README.md`)
- Values from CDK outputs:
  - `ApiEndpoint`
  - `UserPoolId`
  - `UserPoolClientId`

## Environment variables

Create `frontend/.env.local` (never commit secrets or account-specific IDs if your policy forbids it):

```env
NEXT_PUBLIC_API_URL=https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | API Gateway base URL (must include trailing slash if your code expects it) |
| `NEXT_PUBLIC_USER_POOL_ID` | Cognito User Pool ID |
| `NEXT_PUBLIC_USER_POOL_CLIENT_ID` | Cognito App Client ID |

`NEXT_PUBLIC_*` vars are inlined into the client bundle at build time. Rebuild after changing them.

## Getting started

```bash
cd frontend
npm install
```

Copy CDK outputs into `.env.local`, then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development server |
| `npm run build` | Production build + static export to `out/` |
| `npm run start` | Serve a non-export Next server build (not used for S3 static hosting) |
| `npm run lint` | ESLint |

## Features

- **Auth** — Email sign-up / sign-in, email verification code (Cognito), sign out
- **Add vendor** — Name, category, contact email
- **List vendors** — Loaded from DynamoDB via `GET /vendors`
- **Delete vendor** — Removes a row by `vendorId`

### Vendor shape

```ts
interface Vendor {
  vendorId?: string;
  name: string;
  category: string;
  contactEmail: string;
  createdAt?: string;
}
```

## API client (`lib/api.ts`)

| Function | Method | Path | Auth |
|----------|--------|------|------|
| `getVendors()` | `GET` | `/vendors` | ID token |
| `createVendor(vendor)` | `POST` | `/vendors` | ID token + JSON body |
| `deleteVendor(vendorId)` | `DELETE` | `/vendors` | JSON body `{ vendorId }` |

> Note: Backend routes for GET/POST/DELETE are Cognito-protected. Ensure delete requests also send `Authorization` if you see 401s.

## Static export & deploy

`next.config.ts` sets `output: 'export'`, so `npm run build` writes a static site to `frontend/out/`.

The backend CDK stack deploys that folder to S3 and serves it through CloudFront (`DeployWebsite` uses `../frontend/out`).

Typical release flow:

```bash
# 1. Ensure .env.local has production Cognito + API values
cd frontend
npm run build

# 2. Deploy infra (uploads out/ to S3 and invalidates CloudFront)
cd ../backend
npx cdk deploy
```

After deploy, use the `CloudFrontURL` stack output.

## Auth wiring (quick reference)

- `app/providers.tsx` — `Amplify.configure({ Auth: { Cognito: { ... } } }, { ssr: true })`
- `app/page.tsx` — `export default withAuthenticator(Home)`
- Tokens — `fetchAuthSession()` → `session.tokens.idToken`

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Amplify login never appears / Auth errors | Missing or wrong `NEXT_PUBLIC_USER_POOL_*` values; rebuild after changing env |
| `Failed to load vendors` / 401 | Expired or missing ID token; API URL wrong; authorizer misconfigured |
| CORS errors | API Gateway CORS not allowing your origin / headers |
| Blank CloudFront site | Forgot `npm run build` before `cdk deploy`, or `out/` empty |
| Env vars “not updating” | Next inlines `NEXT_PUBLIC_*` at build time — restart `dev` or rebuild |

