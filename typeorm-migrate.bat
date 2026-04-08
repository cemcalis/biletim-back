@echo off
REM TypeORM Helper Script - Generate migration from entities
REM Usage: typeorm-migrate.bat "MigrationName"

if "%1"=="" (
  echo Usage: typeorm-migrate.bat "MigrationName"
  echo Example: typeorm-migrate.bat "CreateUsersTable"
  exit /b 1
)

setlocal enabledelayedexpansion
for /f %%A in ('powershell -Command "Get-Date -UFormat %%s"') do set TIMESTAMP=%%A000

set MIGRATION_NAME=%1
echo Generating migration: %MIGRATION_NAME%

REM Generate migration from entities
npm run typeorm migration:generate "src/database/migrations/%TIMESTAMP%-%MIGRATION_NAME%"

echo Migration generated successfully!
echo To run migrations: npm run typeorm migration:run
