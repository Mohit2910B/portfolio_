param(
  [string]$MySqlUser = $env:DB_USER,
  [string]$MySqlHost = $env:DB_HOST,
  [string]$MySqlPort = $env:DB_PORT
)

if ([string]::IsNullOrWhiteSpace($MySqlUser)) { $MySqlUser = "root" }
if ([string]::IsNullOrWhiteSpace($MySqlHost)) { $MySqlHost = "localhost" }
if ([string]::IsNullOrWhiteSpace($MySqlPort)) { $MySqlPort = "3306" }

Write-Host "Initializing MySQL database 'smeet_portfolio' on $MySqlHost`:$MySqlPort as $MySqlUser" -ForegroundColor Cyan
Write-Host "You will be prompted by the mysql client for the password. The password is not stored by this script." -ForegroundColor Yellow

mysql -u $MySqlUser -h $MySqlHost -P $MySqlPort -p --default-character-set=utf8mb4 < db/mysql/001_complete_schema.sql
if ($LASTEXITCODE -ne 0) { throw "001_complete_schema.sql failed" }

mysql -u $MySqlUser -h $MySqlHost -P $MySqlPort -p --default-character-set=utf8mb4 smeet_portfolio < db/mysql/002_safe_additive_migration.sql
if ($LASTEXITCODE -ne 0) { throw "002_safe_additive_migration.sql failed" }

Write-Host "MySQL schema initialization complete." -ForegroundColor Green
