# Portfolio Starter

This repo has been stripped down to a clean baseline for a full rewrite.

## Current Surface Area

- `/` renders only the preserved intro animation in `components/IntroVideo.tsx`
- `/secret` remains intact, including the secret analytics API route

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Main Files

- `app/page.tsx` for the public entry route
- `components/IntroVideo.tsx` for the preserved opening animation
- `app/secret/page.tsx` for the secret page
- `app/api/secret-data/route.ts` for the secret page backend
- `app/layout.tsx` and `app/globals.css` for the shared shell

