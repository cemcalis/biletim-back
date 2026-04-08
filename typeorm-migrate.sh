#!/bin/bash

# TypeORM Helper Script - Generate migration from entities
# Usage: ./typeorm-migrate.sh "MigrationName"

set -e

if [ -z "$1" ]; then
  echo "Usage: ./typeorm-migrate.sh \"MigrationName\""
  echo "Example: ./typeorm-migrate.sh \"CreateUsersTable\""
  exit 1
fi

MIGRATION_NAME="$1"
TIMESTAMP=$(date +%s)000

echo "Generating migration: $MIGRATION_NAME"

# Generate migration from entities
npm run typeorm migration:generate "src/database/migrations/${TIMESTAMP}-${MIGRATION_NAME}"

echo "Migration generated successfully!"
echo "To run migrations: npm run typeorm migration:run"
