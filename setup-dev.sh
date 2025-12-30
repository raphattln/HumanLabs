#!/bin/bash

# HumanBenchmark Dev Setup Script
# This script ensures the database is running and migrations are applied

set -e

echo "🚀 HumanBenchmark Dev Setup"
echo "=============================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ ERROR: Docker is not installed"
    echo ""
    echo "Please install Docker Desktop:"
    echo "  https://www.docker.com/products/docker-desktop"
    echo ""
    echo "OR use a cloud database:"
    echo "  1. Create a free database at https://www.supabase.com or https://neon.tech"
    echo "  2. Update DATABASE_URL in .env with your connection string"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ ERROR: Docker daemon is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo "✅ Docker is available"

# Start PostgreSQL if not running
echo ""
echo "📦 Starting PostgreSQL..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U johndoe > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL failed to start after 30 seconds"
        echo "Check logs: docker-compose logs postgres"
        exit 1
    fi
    echo "   Attempt $i/30..."
    sleep 1
done

# Generate Prisma Client
echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

# Seed database
echo ""
echo "🌱 Seeding database..."
npx tsx prisma/seed.ts || echo "⚠️  Seed failed (database might already be seeded)"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run: npm run dev"
echo "  2. Open: http://localhost:3000"
echo "  3. Create an account and start playing!"
echo ""
echo "To stop the database: docker-compose down"
echo "To reset everything: docker-compose down -v && ./setup-dev.sh"
