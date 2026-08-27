# MySQL setup (Windows)

This project uses **MySQL 8 + mysql2 + Drizzle ORM**. The setup script is designed to work with an existing database without dropping tables or deleting rows.

## 1. Create `.env.local`

Copy `.env.example` to `.env.local` and set your real local MySQL credentials.

**Never commit `.env.local` or real passwords/API keys to Git.**

If your MySQL password contains URL-reserved characters, URL-encode the password when placing it inside `DATABASE_URL`.

You can also set `DB_PASSWORD` separately; the application safely builds the database connection URL when `DATABASE_URL` is not provided.

## 2. Install packages

```powershell
npm.cmd install