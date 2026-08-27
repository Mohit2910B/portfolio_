param(
  [string]$MySqlUser = $env:DB_USER,
  [string]$MySqlHost = $env:DB_HOST,
  [string]$MySqlPort = $env:DB_PORT
)

if ([string]::IsNullOrWhiteSpace($MySqlUser)) { $MySqlUser = "root" }
if ([string]::IsNullOrWhiteSpace($MySqlHost)) { $MySqlHost = "localhost" }
if ([string]::IsNullOrWhiteSpace($MySqlPort)) { $MySqlPort = "3306" }

$mysql = Get-Command mysql.exe -ErrorAction SilentlyContinue
if ($mysql) {
  $mysqlExe = $mysql.Source
} else {
  $candidates = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe"
  )
  $mysqlExe = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}

if (-not $mysqlExe) {
  throw "mysql.exe was not found. Install MySQL Server or add its bin folder to PATH."
}

Write-Host "Initializing MySQL database 'smeet_portfolio' on $MySqlHost`:$MySqlPort as $MySqlUser" -ForegroundColor Cyan
Write-Host "This setup is additive: it will not drop existing tables or delete rows." -ForegroundColor Yellow
Write-Host "You will be prompted for the MySQL password twice." -ForegroundColor Yellow

& $mysqlExe -u $MySqlUser -h $MySqlHost -P $MySqlPort -p --default-character-set=utf8mb4 < "db/mysql/001_complete_schema.sql"
if ($LASTEXITCODE -ne 0) { throw "001_complete_schema.sql failed" }

& $mysqlExe -u $MySqlUser -h $MySqlHost -P $MySqlPort -p --default-character-set=utf8mb4 smeet_portfolio < "db/mysql/002_safe_additive_migration.sql"
if ($LASTEXITCODE -ne 0) { throw "002_safe_additive_migration.sql failed" }

Write-Host "MySQL schema initialization complete. Existing data was preserved." -ForegroundColor Green
