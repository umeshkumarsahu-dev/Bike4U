#!/bin/bash
set -e

echo "=========================================================="
echo "      Bike for U - Production Docker Setup Script         "
echo "=========================================================="

if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH."
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "Error: Docker Compose is not available."
    exit 1
fi

if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

echo "Building and starting Docker containers in detached mode..."
docker compose up -d --build

echo "Waiting for services to become healthy..."
docker compose ps

echo ""
echo "=========================================================="
echo "Bike for U is up and running!"
echo "Web Application: http://localhost:3000"
echo "Admin CMS:       http://localhost:3000/admin"
echo "Health Endpoint: http://localhost:3000/api/health"
echo "PostgreSQL Port: 5433"
echo "Redis Port:      6380"
echo "=========================================================="
