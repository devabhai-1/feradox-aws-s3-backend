// routes/s3Routes.js
const express = require('express');
const router = express.Router();
const { getSignedUrl } = require('../utils/s3Utils');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
// Firebase Admin SDK को इम्पोर्ट करें (मान लें कि यह utils/firebaseAdmin.js में है)
const { admin } = require('../utils/firebaseAdmin');
const { customAlphabet } = require('nanoid');

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// ... (आपका GET /generate-s3-upload-url राउट वैसा ही रहेगा) ...


// <<< नया राउट यहाँ से शुरू होता है >>>
// POST /api/confirm-upload
router.post(
    '/confirm-upload',
    verifyFirebaseToken, // उपयोगकर्ता प्रमाणित होना चाहिए
    async (req, res) => {
        const userId = req.user.uid;
        // एंड्रॉइड ऐप से यह जानकारी भेजें
        const { s3Key, originalFileName, fileType, mimeType, sizeBytes } = req.body;

        if (!s3Key || !originalFileName || !fileType || !mimeType || !sizeBytes) {
            return res.status(400).json({ error: 'Missing required fields for confirmation.' });
        }

        try {
            const db = admin.database();
            const filesRef = db.ref(`users/${userId}/uploads/${fileType}s`); // जैसे 'images' या 'videos'
            const newFileRef = filesRef.push(); // नई यूनिक ID जेनरेट करें

            // एक छोटा, यूनिक कोड जेनरेट करें
            const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);
            const shortCode = nanoid();

            const fileData = {
                id: newFileRef.key,
                userId: userId,
                s3Bucket: BUCKET_NAME,
                s3Key: s3Key,
                title: originalFileName.split('.').slice(0, -1).join('.'), // एक्सटेंशन हटा दें
                originalFileName: originalFileName,
                fileType: fileType,
                mimeType: mimeType,
                sizeBytes: sizeBytes,
                shortCode: shortCode,
                uploadTimestamp: Date.now(),
            };

            await newFileRef.set(fileData);

            console.log(`[s3Routes] Confirmed and saved file metadata to DB for user ${userId}: ${s3Key}`);
            res.status(201).json({ message: 'File metadata saved successfully.', fileData });

        } catch (error) {
            console.error(`[s3Routes] Error saving file metadata to DB for user ${userId}:`, error);
            res.status(500).json({ error: 'Failed to save file metadata.' });
        }
    }
);
// <<< नया राउट यहाँ खत्म होता है >>>

module.exports = router;
