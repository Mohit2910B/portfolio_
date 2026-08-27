# MySQL setup (Windows)

This project uses **MySQL 8 + mysql2 + Drizzle ORM**. The setup script is designed to work with an existing `smeet_portfolio` database without dropping tables or deleting rows.

## 1. Create `.env.local`

Copy `.env.example` to `.env.local` and set your real password.

If your MySQL password contains `@`, `:`, `/`, `#`, `%`, or another URL-reserved character, the `DATABASE_URL` value must be URL-encoded. For example:

```text
MohitDB@2910  ->  MohitDB%402910
```

You can also set `DB_PASSWORD` to the raw password; the application builds the URL safely when `DATABASE_URL` is not provided.

## 2. Install packages

```powershell
npm.cmd install
```

## 3. Run the safe schema setup

From the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\init-mysql.ps1
```

Enter the same MySQL root password when prompted.

The script:

1. Creates missing tables.
2. Adds missing columns to older tables.
3. Does **not** drop tables.
4. Does **not** delete existing rows.
5. Leaves content seeding to the application bootstrap.

## 4. Start the site

```powershell
npm.cmd run dev
```

Open `http://localhost:3000`.

## Important

Do **not** use `drizzle-kit push` against the existing database for this project. Drizzle may interpret the older database structure as destructive changes and offer to delete populated tables. Use the provided additive MySQL setup script instead.
