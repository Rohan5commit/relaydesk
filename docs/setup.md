# Setup Guide

## Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or yarn
- Git
- Vercel CLI (for deployment)

## Environment Variables

Create a `.env.local` file in the project root:

```bash
# NVIDIA NIM API Key (get from https://docs.api.nvidia.com)
NIM_API_KEY=nvapi-YOUR_NIM_API_KEY_HERE

# Aicoo API Key (get from https://www.aicoo.io/settings/api-keys)
AICOO_API_KEY=aicoo_sk_live_YOUR_AICOO_API_KEY_HERE
```

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/Rohan5commit/relaydesk.git
cd relaydesk
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run development server

```bash
npm run dev
```

### 4. Open the application

Navigate to [http://localhost:3000](http://localhost:3000)

## Aicoo API Setup

1. Go to [Aicoo Settings → API Keys](https://www.aicoo.io/settings/api-keys)
2. Create a new API key
3. Copy the key and add it to `.env.local` as `AICOO_API_KEY`

## NVIDIA NIM Setup

1. Go to [NVIDIA API Catalog](https://docs.api.nvidia.com)
2. Create an API key
3. Copy the key and add it to `.env.local` as `NIM_API_KEY`

## Deploy to Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

```bash
vercel
```

### 4. Set environment variables

```bash
vercel env add NIM_API_KEY
vercel env add AICOO_API_KEY
```

### 5. Deploy to production

```bash
vercel --prod
```

## Demo Mode

The application includes demo mode with seeded data:

1. Navigate to `/demo`
2. Select a scenario or create a custom request
3. The system will process the request through the full workflow

## Troubleshooting

### API Key Issues

If you see authentication errors:
1. Verify your API keys are correct
2. Check that `.env.local` is in the project root
3. Restart the development server

### Build Errors

If the build fails:
1. Run `npm run build` to see detailed errors
2. Check for TypeScript errors
3. Verify all dependencies are installed

### Deployment Issues

If deployment fails:
1. Check Vercel logs
2. Verify environment variables are set
3. Ensure all files are committed

## Development Workflow

1. Create a feature branch
2. Make changes
3. Run `npm run lint` and `npm run build`
4. Test locally
5. Commit and push
6. Create a pull request

## Project Structure

```
relaydesk/
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components
│   └── lib/           # Utilities and services
│       ├── aicoo/     # Aicoo API client
│       ├── ai/        # NVIDIA NIM integration
│       ├── schemas/   # Zod schemas
│       ├── intake/    # Request processing
│       ├── routing/   # Routing logic
│       ├── context/   # Data storage
│       └── resolution/ # Resolution handling
├── docs/              # Documentation
└── public/            # Static assets
```
