#!/bin/sh
set -e

echo "=== Initializing Bike for U Production Environment ==="

# 1. Sync database schema
echo "Applying database schema migrations..."
npx prisma db push --accept-data-loss

# 2. Seed database with Indian two-wheelers catalogue
echo "Seeding two-wheeler variants and dataset version..."
npx tsx prisma/seed.ts || node -r esbuild-register prisma/seed.ts || echo "Seed completed or skipped"

echo "=== System Ready! Launching Next.js Web Server ==="
exec "$@"
