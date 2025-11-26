# 🧪 Local Development Setup

Run the SouthCoast ProMotion app locally with full frontend/backend integration.

---

## ✅ Prerequisites

- Node.js 18+
- PostgreSQL 13+
- `.env.local` configured

---

## 🛠 First-Time Setup

```bash
cp .env.example .env.local
npm install
```

### Optional:
- Start PostgreSQL and create your database
- Run SQL migrations manually if needed

---

## 🚀 Start Local Dev

```bash
npm run dev
```

This runs:
- `dev:client`: Vite React frontend
- `dev:server`: Express backend (ts-node)

---

## ✅ Checklist

- [ ] DB is running
- [ ] `.env.local` is set
- [ ] App loads at `localhost:3000` or Vite port
- [ ] Test endpoints `/health`, `/api/campaigns`

---

## 🔍 Useful Scripts

| Script         | Description                   |
|----------------|-------------------------------|
| `npm run dev`  | Starts full stack             |
| `dev:client`   | Vite-only                     |
| `dev:server`   | Server-only (ts-node)         |
