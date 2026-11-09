# Buzquitos Whitelist — Next.js + MongoDB

A responsive, animated NFT whitelist landing page for **Buzquitos** inspired by pixel-art characters. Includes a separate private admin dashboard. The public site has no gallery and no admin navigation.

## Features

- Lime-green / pixel-art public landing page for **Buzquitos**
- Collection details, project intro, roadmap, whitelist form, FAQ and social footer
- Mobile navigation, motion effects and submission success state
- **MongoDB**-backed whitelist submissions with case-insensitive unique wallet enforcement
- Private `/admin/login` and `/admin` dashboard with secure session-cookie authentication
- Admin review actions: approve, reject, delete, search, filter and CSV export
- Admin-editable collection settings stored dynamically in MongoDB
- MongoDB database initialization script (`scripts/init-db.mjs`)

## 1. Requirements

- Node.js 20.x or newer (recommended: WSL Ubuntu or native)
- MongoDB instance (local or MongoDB Atlas connection string)
- npm

## 2. Install

In WSL Ubuntu:

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local` with your configuration:

- `MONGODB_URI`: MongoDB connection string (e.g. `mongodb://127.0.0.1:27017/buzquitos` or Atlas URI)
- `ADMIN_EMAIL`: Admin login email (e.g. `admin@buzquitos.com`)
- `ADMIN_PASSWORD`: Admin login password
- `ADMIN_SESSION_SECRET`: Random 32+ character secret string for signing session cookies
- `ADMIN_EMAILS`: Optional comma-separated allow-list for admin emails
- `NEXT_PUBLIC_COLLECTION_NAME`: Default collection name (`Buzquitos`)

## 3. Initialize the Database (Optional / Automatic)

The app automatically ensures required indexes on launch. You can also run the initialization script to seed the default collection settings:

```bash
node scripts/init-db.mjs
```

## 4. Admin Access

1. Open `/admin/login`. (The public website does not link to this route).
2. Sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` configured in your `.env.local`.
3. Manage whitelist entries (approve/reject/delete/search/export CSV) and update live collection settings from the dashboard.

## 5. Run Locally

```bash
npm run dev
```

- Public website: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin/login

## 6. Build & Production

```bash
npm run build
npm start
```

## Public Collection Details

The public page reads the `collection_settings` collection in MongoDB on the server. Admin edits to collection name, tagline, network, supply, mint price and mint date appear on the public page on the next request.
