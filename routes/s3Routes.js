// routes/s3Routes.js
const express = require('express');
const router = express.Router();
const s3Controller = require('../controllers/s3Controller');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');

router.get('/generate-s3-upload-url', verifyFirebaseToken, s3Controller.generateUploadUrl);
router.post('/confirm-upload', verifyFirebaseToken, s3Controller.confirmUpload);

module.exports = router;
