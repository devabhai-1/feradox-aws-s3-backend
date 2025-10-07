// routes/s3Routes.js
const express = require('express');
const router = express.Router();
const s3Controller = require('../controllers/s3Controller'); // कंट्रोलर को इम्पोर्ट करें
const { verifyFirebaseToken } = require('../middleware/authMiddleware'); // मिडलवेयर को इम्पोर्ट करें

// राउट 1: GET /api/generate-s3-upload-url
// यह राउट एक सुरक्षित URL जेनरेट करता है।
router.get(
    '/generate-s3-upload-url',
    verifyFirebaseToken,      // पहले टोकन वेरिफाई करें
    s3Controller.generateUploadUrl // फिर कंट्रोलर को कॉल करें
);

// राउट 2: POST /api/confirm-upload
// यह राउट अपलोड की पुष्टि करता है और डेटाबेस में जानकारी सहेजता है।
router.post(
    '/confirm-upload',
    verifyFirebaseToken,   // पहले टोकन वेरिफाई करें
    s3Controller.confirmUpload // फिर कंट्रोलर को कॉल करें
);

module.exports = router;
