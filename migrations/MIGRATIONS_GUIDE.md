
# Migration Guide

This guide outlines how database migrations are managed in this project using Drizzle ORM.

---

## 🧱 Migrations Overview

Drizzle ORM is used for defining and running schema migrations. All migration files live in this directory.

---

## ✅ Running Migrations

```bash
npx drizzle-kit push
```

This applies any new migrations to your database.

---

## 🔄 Generating Migrations

When you change a schema (e.g., add/remove fields), generate a new migration file:

```bash
npx drizzle-kit generate
```

Then push it:

```bash
npx drizzle-kit push
```

---

## 🌐 More Info

Refer to [Drizzle ORM documentation](https://orm.drizzle.team/docs/sql-schema-declaration) for deeper understanding.

