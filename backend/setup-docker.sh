#!/bin/bash

# Docker Integration Setup Script for LightNode
# This script configures your system for Docker-based Minecraft server provisioning

set -e  # Exit on error

echo "🐳 LightNode Docker Integration Setup"
echo "======================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# STEP 1: Check Docker Installation
# ============================================================================

echo -e "${YELLOW}[1/5] Checking Docker installation...${NC}"

if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker is not installed${NC}"
  echo ""
  echo "Install Docker from: https://docs.docker.com/get-docker/"
  echo ""
  echo "Quick install (Ubuntu/Debian):"
  echo "  curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
  exit 1
fi

DOCKER_VERSION=$(docker --version)
echo -e "${GREEN}✅ Docker found: $DOCKER_VERSION${NC}"
echo ""

# ============================================================================
# STEP 2: Check Docker Daemon
# ============================================================================

echo -e "${YELLOW}[2/5] Checking Docker daemon...${NC}"

if ! docker ps &> /dev/null; then
  echo -e "${RED}❌ Docker daemon is not running${NC}"
  echo ""
  echo "Start Docker:"
  echo "  sudo systemctl start docker  # Linux"
  echo "  open -a Docker              # macOS"
  echo "  systemctl start docker      # Windows (WSL)"
  exit 1
fi

CONTAINER_COUNT=$(docker ps -a --format '{{.ID}}' | wc -l)
IMAGE_COUNT=$(docker images --format '{{.ID}}' | wc -l)
echo -e "${GREEN}✅ Docker daemon is running${NC}"
echo "   Containers: $CONTAINER_COUNT | Images: $IMAGE_COUNT"
echo ""

# ============================================================================
# STEP 3: Set Up User Permissions
# ============================================================================

echo -e "${YELLOW}[3/5] Setting up user permissions...${NC}"

CURRENT_USER=$(whoami)

if groups $CURRENT_USER | grep &> /dev/null '\bdocker\b'; then
  echo -e "${GREEN}✅ User '$CURRENT_USER' is in docker group${NC}"
else
  echo -e "${YELLOW}⚠️  Adding user '$CURRENT_USER' to docker group...${NC}"
  sudo usermod -aG docker $CURRENT_USER
  echo -e "${YELLOW}ℹ️  Please log out and log back in for changes to take effect${NC}"
  echo -e "${YELLOW}ℹ️  Or run: newgrp docker${NC}"
fi
echo ""

# ============================================================================
# STEP 4: Create Data Directory
# ============================================================================

echo -e "${YELLOW}[4/5] Setting up data directory...${NC}"

DATA_DIR="/var/lib/lighth/data"

if [ ! -d "$DATA_DIR" ]; then
  echo -e "${YELLOW}Creating directory: $DATA_DIR${NC}"
  sudo mkdir -p "$DATA_DIR"
  sudo chown $CURRENT_USER:$CURRENT_USER "$DATA_DIR"
  sudo chmod 755 "$DATA_DIR"
  echo -e "${GREEN}✅ Created: $DATA_DIR${NC}"
else
  echo -e "${GREEN}✅ Directory exists: $DATA_DIR${NC}"
fi

# Check write permissions
if [ -w "$DATA_DIR" ]; then
  echo -e "${GREEN}✅ User has write permissions${NC}"
else
  echo -e "${YELLOW}⚠️  Fixing permissions...${NC}"
  sudo chown $CURRENT_USER:$CURRENT_USER "$DATA_DIR"
  sudo chmod 755 "$DATA_DIR"
  echo -e "${GREEN}✅ Permissions fixed${NC}"
fi
echo ""

# ============================================================================
# STEP 5: Install Node Dependencies
# ============================================================================

echo -e "${YELLOW}[5/5] Installing Node.js dependencies...${NC}"

if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ package.json not found${NC}"
  echo "Please run this script from the backend directory:"
  echo "  cd backend && bash ../setup-docker.sh"
  exit 1
fi

if grep -q "dockerode" package.json; then
  echo -e "${GREEN}✅ dockerode already in package.json${NC}"
else
  echo -e "${YELLOW}Installing dockerode...${NC}"
  npm install dockerode
  echo -e "${GREEN}✅ dockerode installed${NC}"
fi
echo ""

# ============================================================================
# VERIFICATION
# ============================================================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo "Configuration Summary:"
echo "  Docker Version: $DOCKER_VERSION"
echo "  User: $CURRENT_USER"
echo "  Data Directory: $DATA_DIR"
echo "  Docker Socket: /var/run/docker.sock"
echo ""

echo "Next Steps:"
echo "  1. Start the backend server:"
echo "     npm start"
echo ""
echo "  2. Test Docker connection:"
echo "     curl http://localhost:3000/api/health/docker"
echo ""
echo "  3. Create first server via API:"
echo "     curl -X POST http://localhost:3000/api/servers \\"
echo "       -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"name\":\"Test\",\"memory\":2,\"diskSpace\":10}'"
echo ""
echo "  4. Monitor container:"
echo "     docker ps -a"
echo "     docker logs mc-1-test"
echo ""
echo "  5. Join Minecraft:"
echo "     Server IP: localhost:25568 (or your machine IP)"
echo ""

echo -e "${YELLOW}Useful Commands:${NC}"
echo "  View all containers:    docker ps -a"
echo "  View container logs:    docker logs <container-name>"
echo "  Stop container:         docker stop <container-name>"
echo "  Remove container:       docker rm <container-name>"
echo "  List all volumes:       docker volume ls"
echo "  Inspect server data:    ls -la $DATA_DIR"
echo ""

echo -e "${GREEN}Happy hosting! 🎮${NC}"
