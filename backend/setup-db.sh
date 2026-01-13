#!/bin/bash

echo "🔧 Setting up PostgreSQL database for Lighth..."

# Create user if not exists
sudo -u postgres psql -c "CREATE USER lighth WITH PASSWORD 'lighth_dev_password_123';" 2>/dev/null || echo "User already exists"

# Create database if not exists
sudo -u postgres psql -c "CREATE DATABASE lighth OWNER lighth;" 2>/dev/null || echo "Database already exists"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE lighth TO lighth;" 2>/dev/null

echo "✅ Database setup complete"

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ All done!"
