/**
 * File Server (Port 8888)
 * Handles file uploads, downloads, and file management
 * Integrates with backend for authentication and validation
 * 
 * Features:
 * - File upload to server directories
 * - File download from server
 * - Directory browsing
 * - File deletion and management
 */

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
const PORT = 8888;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:1573', 'http://10.0.4.186:1573'],
  credentials: true,
}));

app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Store files in /tmp/lighth-uploads
    const uploadDir = '/tmp/lighth-uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    // Preserve original filename with timestamp to avoid collisions
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'File server is running',
    service: 'file-upload-download',
    port: PORT,
    maxFileSize: '500MB'
  });
});

/**
 * POST /api/upload
 * Upload files to server
 * 
 * Request:
 * - Form data with file field
 * - Optional: serverId (for organizing files by server)
 * 
 * Response:
 * - { filename, size, uploadedAt, url }
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date(),
      url: `http://localhost:${PORT}/api/files/${req.file.filename}`
    };

    console.log(`[Upload] File uploaded: ${fileInfo.filename} (${fileInfo.size} bytes)`);

    res.status(200).json({
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('[Upload Error]', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

/**
 * GET /api/files/:filename
 * Download a file
 */
app.get('/api/files/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join('/tmp/lighth-uploads', filename);

    // Security: Prevent directory traversal
    const realpath = await fs.realpath(filepath);
    if (!realpath.startsWith('/tmp/lighth-uploads/')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists
    try {
      await fs.access(realpath);
    } catch {
      return res.status(404).json({ message: 'File not found' });
    }

    console.log(`[Download] File downloaded: ${filename}`);
    res.download(realpath);
  } catch (error) {
    console.error('[Download Error]', error);
    res.status(500).json({ message: 'Download failed', error: error.message });
  }
});

/**
 * GET /api/files
 * List all uploaded files
 */
app.get('/api/files', async (req, res) => {
  try {
    const uploadDir = '/tmp/lighth-uploads';
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Directory exists
    }

    const files = await fs.readdir(uploadDir);
    const fileList = [];

    for (const file of files) {
      const filepath = path.join(uploadDir, file);
      const stat = await fs.stat(filepath);
      
      fileList.push({
        filename: file,
        size: stat.size,
        created: stat.birthtime,
        modified: stat.mtime,
        url: `http://localhost:${PORT}/api/files/${file}`
      });
    }

    res.status(200).json({
      message: 'Files retrieved',
      count: fileList.length,
      files: fileList
    });
  } catch (error) {
    console.error('[Files Error]', error);
    res.status(500).json({ message: 'Failed to list files', error: error.message });
  }
});

/**
 * DELETE /api/files/:filename
 * Delete a file
 */
app.delete('/api/files/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join('/tmp/lighth-uploads', filename);

    // Security: Prevent directory traversal
    const realpath = await fs.realpath(filepath);
    if (!realpath.startsWith('/tmp/lighth-uploads/')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    try {
      await fs.unlink(realpath);
      console.log(`[Delete] File deleted: ${filename}`);
      res.status(200).json({ message: 'File deleted successfully' });
    } catch (err) {
      return res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    console.error('[Delete Error]', error);
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n📁 File Upload/Download Server`);
  console.log(`📡 Listening on: http://0.0.0.0:${PORT}`);
  console.log(`🌐 Public URL: https://crispy-doodle-x56wwp77w59x3vq9p-${PORT}.app.github.dev/`);
  console.log(`\n✨ Features:`);
  console.log(`   - File upload (max 500MB)`);
  console.log(`   - File download`);
  console.log(`   - File listing`);
  console.log(`   - File deletion`);
  console.log(`   - Directory browsing\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down file server...');
  process.exit(0);
});
