const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Register a new user
 * POST /api/auth/register
 * Body: { email, username, password }
 */
const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validate input
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Email, username, and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'user',
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * Login a user
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Test login - creates/gets a test account for quick testing
 * POST /api/auth/test-login
 * No authentication required
 */
const testLogin = async (req, res) => {
  try {
    const testEmail = 'test@lighth.io';
    const testPassword = 'test123456';
    const testUsername = 'testuser';

    // Try to find existing test user
    let user = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    // If doesn't exist, create it
    if (!user) {
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      user = await prisma.user.create({
        data: {
          email: testEmail,
          username: testUsername,
          password: hashedPassword,
          role: 'user',
        },
      });
      console.log('[Test Account] Created test user:', testEmail);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Test login successful',
      token,
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
      note: 'Test credentials: test@lighth.io / test123456'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during test login' });
  }
};

module.exports = { register, login, testLogin };
