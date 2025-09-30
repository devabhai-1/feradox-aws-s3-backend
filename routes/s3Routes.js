// routes/s3Routes.js
const express = require('express');
const s3Controller = require('../controllers/s3Controller');
const { verifyFirebaseToken } = require('../middleware/authMiddleware'); // प्रमाणीकरण मिडलवेयर इम्पोर्ट करें

const router = express.Router();

// '/get-url' मार्ग के लिए, पहले verifyFirebaseToken मिडलवेयर चलाएं, फिर s3Controller.getSignedUrl
// Android ऐप से 'fileName' और 'fileType' क्वेरी पैरामीटर के रूप में अपेक्षित हैं
router.get('/get-url', verifyFirebaseToken, s3Controller.getSignedUrl);

module.exports = router;
