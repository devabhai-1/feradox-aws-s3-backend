// routes/s3Routes.js
const express = require('express');
const router = express.Router();

// कंट्रोलर को इम्पोर्ट करें
const s3Controller = require('../controllers/s3Controller');

// मिडलवेयर को इम्पोर्ट करें
const { verifyFirebaseToken } = require('../middleware/authMiddleware');

// राउट 1: GET /api/generate-s3-upload-url
// <<< यह लाइन अब s3Controller.generateUploadUrl का सही उपयोग कर रही है >>>
router.get(
    '/generate-s3-upload-url',
    verifyFirebaseToken,
    s3Controller.generateUploadUrl
);

// राउट 2: POST /api/confirm-upload
// <<< यह लाइन अब s3Controller.confirmUpload का सही उपयोग कर रही है >>>
router.post(
    '/confirm-upload',
    verifyFirebaseToken,
    s3Controller.confirmUpload
);

module.exports = router;
