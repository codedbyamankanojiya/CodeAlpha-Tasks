const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const { uploadFile, getBoardFiles, downloadFile, deleteFile } = require('../controllers/fileController');

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// All routes require authentication
router.use(protect);

// File routes
router.post('/boards/:boardId/files', upload.single('file'), uploadFile);
router.get('/boards/:boardId/files', getBoardFiles);
router.get('/files/:fileId/download', downloadFile);
router.delete('/files/:fileId', deleteFile);

module.exports = router;
