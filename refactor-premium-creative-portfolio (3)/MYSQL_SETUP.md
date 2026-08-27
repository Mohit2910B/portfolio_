# MySQL 8.0 Setup — `smeet_portfolio`

This project keeps the existing Next.js UI and CMS architecture intact. The files in `db/mysql/` create the complete MySQL schema required by the current portfolio/CMS features.

## Required `.env`

Create `.env` from `.env.example` and set your real MySQL password locally:

```env
DATABASE_URL=mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/smeet_portfolio
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smeet_portfolio
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
UPLOAD_DIR=./storage/uploads
MAX_UPLOAD_MB=300
SEED_ADMIN_NAME=Mohit Babariya
SEED_ADMIN_EMAIL=admin@mohitbabariya.studio
SEED_ADMIN_USERNAME=mohit
SEED_ADMIN_PASSWORD=CHANGE_THIS_PASSWORD
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never commit a real MySQL password.

## Initialize MySQL from PowerShell

From the project root:

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS smeet_portfolio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p --default-character-set=utf8mb4 < db/mysql/001_complete_schema.sql
mysql -u root -p --default-character-set=utf8mb4 smeet_portfolio < db/mysql/002_safe_additive_migration.sql
```

Or run the helper script:

```powershell
$env:DB_USER="root"
$env:DB_HOST="localhost"
$env:DB_PORT="3306"
powershell -ExecutionPolicy Bypass -File .\scripts\init-mysql.ps1
```

## Run the project

```powershell
npm install
npm run dev
```

Open:

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin

## Migration files

- `db/mysql/001_complete_schema.sql` — full schema, safe for a fresh database and safe to rerun.
- `db/mysql/002_safe_additive_migration.sql` — additive column migration for older MySQL databases.

## Tables created

- `admins`
- `admin_sessions`
- `categories`
- `work_options`
- `projects`
- `media_files`
- `services`
- `skills`
- `software_tools`
- `homepage_settings`
- `contact_settings`
- `theme_settings`
- `layout_sections`
- `site_settings`
- `carousel_settings`
- `carousel_items`
- `enquiries`
- `chat_conversations`
- `chat_messages`

## Notes

- Admin registration is not public in the application UI/API; only an authenticated admin can create another admin.
- Passwords are stored as secure hashes in `admins.password_hash`; never store plaintext passwords.
- Uploaded media metadata is stored in `media_files`; files are stored under `UPLOAD_DIR`.
- Existing UI/design was not replaced or redesigned.
