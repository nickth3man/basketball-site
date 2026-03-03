# NBA Reference (Frontend)

This is the Next.js frontend application for the Basketball Site. It interfaces
with the local SQLite database to serve comprehensive basketball statistics,
historical team records, and player attributes.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Database:** SQLite (accessed cleanly via `better-sqlite3`)
- **Testing:** Vitest

## Getting Started

First, navigate to this directory and install the necessary dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the
result.

## Development

You can start editing the page by modifying `src/app/page.tsx`. The page
auto-updates as you edit the local files.

Database queries and logical models are located inside `src/lib/`. The
application looks for the `nba_raw_data.db` database inside the same directory
or where specified via the `DB_PATH` environment variable.

This project uses
[`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
to automatically optimize and load Geist, a custom font family.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Build for Production

To create a production build and run it locally:

```bash
npm run build
npm start
```
