# 🚀 Lighth Backend - Quick Start Guide

## The Brain of Lighth is Ready!

You now have a complete **"Nervous System"** for your Minecraft hosting platform. Here's what's built:

### ✅ What You Have

1. **Authentication System** (The Gatekeeper)
   - User registration with email/username/password
   - Secure login with JWT tokens
   - Password hashing with bcryptjs
   - 7-day token expiration

2. **Database Schema** (The Memory)
   - `User` model - stores user accounts with roles
   - `Server` model - stores Minecraft servers with specs
   - Relationships - each user owns multiple servers
   - PostgreSQL database with Prisma ORM

3. **API Endpoints** (The Brain)
   - `/api/auth/register` - Create new user accounts
   - `/api/auth/login` - Authenticate and get JWT token
   - `/api/servers` - List, create, update, delete servers
   - Protected routes - All server operations require JWT

## 🏃 Getting Started (5 Minutes)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Setup Database
