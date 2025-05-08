const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In a real app, use a database. This is just for demonstration.
const users = [];

// Add a test admin user
(async () => {
  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);
    
    // Create admin user
    const adminUser = {
      id: uuidv4(),
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      createdAt: new Date()
    };
    
    // Add to users array if not already exists
    if (!users.find(user => user.email === adminUser.email)) {
      users.push(adminUser);
      console.log('Test admin user created:', adminUser.email);
    }
  } catch (error) {
    console.error('Error creating test user:', error);
  }
})();

// Environment variables should be used for secrets in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Log the registration attempt
    console.log('Registration attempt:', { email, name });
    
    // Check if user already exists
    if (users.find(user => user.email === email)) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      createdAt: new Date()
    };
    
    users.push(newUser);
    console.log('New user registered:', { id: newUser.id, email: newUser.email, name: newUser.name });
    
    // Create JWT token
    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '1d' });
    
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    // Find user
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Set token expiration based on rememberMe
    const expiresIn = rememberMe ? '30d' : '1d';
    
    // Create JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn });
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Get current user
router.get('/user', auth, (req, res) => {
  const user = users.find(user => user.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  res.json({
    id: user.id,
    email: user.email,
    name: user.name
  });
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    
    // Find user
    const user = users.find(user => user.id === req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update user data
    user.name = name || user.name;
    
    // Update password if provided
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }
    
    console.log('User profile updated:', { id: user.id, email: user.email, name: user.name });
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = { router, auth };



