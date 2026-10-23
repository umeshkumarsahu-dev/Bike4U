#!/bin/sh

echo "=== Initializing Bike for U Production Environment ==="

# 1. Sync database schema (non-blocking if DB is still provisioning)
echo "Checking database connection and applying migrations..."
if npx prisma db push --accept-data-loss; then
  echo "Database schema synchronized successfully."
  echo "Seeding two-wheeler variants and dataset version..."
  npx tsx prisma/seed.ts || echo "Seed completed or skipped."
else
  echo "WARNING: Could not connect to database at DATABASE_URL."
  echo "Please ensure DATABASE_URL is set correctly in your Render Environment tab."
fi

echo "=== Launching Next.js Web Server ==="
exec "$@"
