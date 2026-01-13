#!/bin/bash

# PostgreSQL Setup Script for LightNode
# This script installs and configures PostgreSQL for development

echo "🚀 Installing PostgreSQL for LightNode..."

# Update package lists
echo "📦 Updating package lists..."
sudo apt-get update -qq

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
sudo apt-get install -y postgresql postgresql-contrib 2>&1 | grep -E "^Setting up|done"

# Start PostgreSQL service
echo "🔧 Starting PostgreSQL service..."
sudo service postgresql start

# Create database and user
echo "🗄️  Creating database and user..."
sudo -u postgres psql <<EOF
CREATE USER lighth WITH PASSWORD 'lighth_dev_password_123';
CREATE DATABASE lighth OWNER lighth;
GRANT ALL PRIVILEGES ON DATABASE lighth TO lighth;
EOF

echo "✅ PostgreSQL setup complete!"
echo ""
echo "📝 Database credentials:"
echo "   User: lighth"
echo "   Password: lighth_dev_password_123"
echo "   Database: lighth"
echo "   Host: localhost"
echo "   Port: 5432"
echo ""
echo "🔗 Connection string:"
echo "   postgresql://lighth:lighth_dev_password_123@localhost:5432/lighth?schema=public"
echo ""
echo "Next steps:"
echo "1. Run Prisma migrations: npx prisma migrate dev --name init"
echo "2. Start the backend: npm start (from backend directory)"
echo "3. Start the WebSocket server: node websocket-server.js"
echo "4. Start the file server: node file-server.js"
echo "5. Start the frontend: npm run dev (from root directory)"
