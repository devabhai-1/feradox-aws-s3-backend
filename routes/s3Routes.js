// routes/s3Routes.js
const express = require('express');
const router = express.Router();
const s3Controller = require('../controllers/s3Controller');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');

// GET /api/generate-s3-upload-url
router.get('/generate-s3-upload-url', verifyFirebaseToken, s3Controller.generateUploadUrl);

// POST /api/confirm-upload
router.post('/confirm-upload', verifyFirebaseToken, s3Controller.confirmUpload);

module.exports = router;
