# 🚀 Deployment Checklist

Ensure a smooth deployment of the SouthCoast ProMotion app to Render or similar platforms.

---

## ✅ Pre-Deployment

- [ ] Code is pushed to GitHub
- [ ] Repo is connected to Render
- [ ] `.env` variables configured in Render
- [ ] Database is created and reachable

---

## 🏗️ Deployment Tasks

- [ ] Set build command (if needed): `npm run build`
- [ ] Set start command: `npm run start` or equivalent
- [ ] Run database migrations manually (or automate)

---

## 🔍 Post-Deployment Sanity Check

- [ ] Home page loads (`/`)
- [ ] Booking system is functional
- [ ] Admin panel loads (`/admin`)
- [ ] `/health` returns OK
- [ ] No console errors in frontend/backend
- [ ] Sentry (if enabled) is capturing errors

---

## 🔄 Optional: CI/CD

Consider setting up GitHub Actions for:
- Auto deployment
- Lint + type check
- Test runner (Vitest)

---

> Keep backups before every deploy. Scripts in `/scripts` can automate this.
