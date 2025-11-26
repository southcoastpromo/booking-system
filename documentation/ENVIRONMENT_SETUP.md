# ⚙️ Environment Setup

Configure environment variables for all environments (`.env`, `.env.local`, Render).

---

## 📄 File Usage

- `.env.local`: Used locally (should not be committed)
- `.env`: Used in deployment environments (Render, etc.)
- `.env.example`: Template with all required keys

---

## 🔑 Required Variables

| Key               | Description                |
|------------------|----------------------------|
| `DATABASE_URL`    | PostgreSQL connection URI |
| `SESSION_SECRET`  | Secret for cookie sessions|
| `PORT`            | Server port (default 3000)|
| `SENTRY_DSN`      | Optional error logging    |

---

## 📁 Suggested Grouping

### 🔒 Auth
- `SESSION_SECRET`

### 🗄️ Database
- `DATABASE_URL`

### 🚀 Server
- `PORT`

### 🛠️ Monitoring
- `SENTRY_DSN`

---

> TIP: Store `.env.local` securely and never commit it to GitHub.
