# SouthCoast ProMotion Campaign Booking System

A full-stack TypeScript application for managing advertising campaign bookings. Built with Vite, React, Node.js, Drizzle ORM, and Tailwind CSS. Designed for performance, accessibility, and developer handover readiness.

---

## 🚀 Features

- Modular, type-safe full-stack codebase (TypeScript + Zod)
- React frontend with accessibility features (ARIA, skip links, focus management)
- Node.js backend with secure session and error handling middleware
- Drizzle ORM with PostgreSQL migrations and schema typing
- API validated with Zod + OpenAPI
- Robust environment config validation using Zod
- Lazy-loaded charts, file uploads, and booking logic
- CI/CD-ready structure with deployment checklist

---

## 📦 Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Node.js, Express
- **ORM**: Drizzle + PostgreSQL
- **Validation**: Zod
- **Testing**: Vitest, Supertest
- **Auth/Security**: Session-based, CSRF, ENV validation
- **Deployment**: Replit/Node/Docker/Manual compatible

---

## 🛠 Local Development

```bash
# Install Node version 18
nvm use

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run development server
npm run dev
```

---

## 🧪 Testing

```bash
npm run test
```

---

## 🧾 Scripts

- `npm run dev` – Start dev server
- `npm run build` – Build for production
- `npm run lint` – Run ESLint
- `npm run test` – Run Vitest

---

## 📁 Project Structure

```bash
client/          # React frontend
server/          # Express backend
shared/          # Shared types and utils
config/          # Zod env validation
lib/             # HTTP schema + validation logic
types/           # Global TS declarations
tests/           # Vitest + Supertest tests
migrations/      # SQL migrations
scripts/         # DevOps and tooling
documentation/   # Setup, deployment guides
```

---

## ✅ Requirements

- Node.js `v18` (via `.nvmrc`)
- PostgreSQL (or compatible DB)
- Environment variables (see `.env.example`)

---

## 📦 Deployment

See `documentation/DEPLOYMENT_CHECKLIST.md` for a full deployment guide.

---

## 👥 Contributing

Ensure lint, type-check, and tests pass before committing:

```bash
npm run lint && npm run test
```

---

## 📝 License

MIT — SouthCoast ProMotion Development Team
