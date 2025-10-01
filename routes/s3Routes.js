// routes/s3Routes.js
const express = require('express');
const router = express.Router();
const { getSignedUrl } = require('../utils/s3Utils');
// const { verifyFirebaseToken } = require('../middleware/authMiddleware'); // यदि आवश्यक हो तो अनकमेंट करें

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

console.log('[s3Routes.js] File loaded and router instance created.');

// GET /generate-presigned-url (प्रीसाइन्ड अपलोड URL के लिए)
// पूर्ण पथ: /api/generate-presigned-url
router.get(
    '/generate-presigned-url',
    // verifyFirebaseToken, // <-- प्रमाणीकरण के लिए
    async (req, res) => {
        const userId = req.user?.uid || 'anonymous-user'; // प्रमाणीकरण से UID प्राप्त करें या डिफ़ॉल्ट
        console.log(`[s3Routes] GET /generate-presigned-url (for Upload) hit. Query:`, req.query, "User ID:", userId);

        const { fileName, fileType } = req.query;

        if (!fileName || !fileType) {
            console.log("[s3Routes Upload] Bad Request: Missing fileName or fileType.");
            return res.status(400).json({ error: 'fileName and fileType query parameters are required for upload URL.' });
        }
        if (!BUCKET_NAME) {
            console.error("[s3Routes Upload] Server Error: AWS_S3_BUCKET_NAME not set.");
            return res.status(500).json({ error: 'Server configuration error: S3 bucket name not set.' });
        }

        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-\s]/g, '_');
        const s3Key = `${userId}/${Date.now()}_${sanitizedFileName}`;

        try {
            console.log(`[s3Routes Upload] Attempting to generate presigned UPLOAD URL for bucket: ${BUCKET_NAME}, key: ${s3Key}, contentType: ${fileType}`);
            const uploadUrl = await getSignedUrl(
                BUCKET_NAME,
                s3Key,
                fileType,
                'putObject', // <<< ऑपरेशन 'putObject' है
                300
            );
            console.log("[s3Routes Upload] Successfully generated presigned UPLOAD URL:", uploadUrl);
            res.json({
                uploadUrl: uploadUrl,
                s3Key: s3Key,
                originalFileName: fileName, // मूल fileName का उपयोग करें यदि आवश्यक हो, या sanitizedFileName
                s3Bucket: BUCKET_NAME
            });
        } catch (error) {
            console.error(`[s3Routes Upload] Error in getSignedUrl for key ${s3Key}:`, error.message, error.stack);
            res.status(500).json({ error: `Failed to generate presigned upload URL. Details: ${error.message}` });
        }
    }
);

// ---- नया एंडपॉइंट: प्रीसाइन्ड डाउनलोड URL के लिए ----
// GET /generate-download-url
// पूर्ण पथ: /api/generate-download-url
router.get(
    '/generate-download-url',
    // verifyFirebaseToken, // <-- प्रमाणीकरण के लिए
    async (req, res) => {
        const userId = req.user?.uid || 'anonymous-user'; // प्रमाणीकरण से UID प्राप्त करें या डिफ़ॉल्ट
        console.log(`[s3Routes] GET /generate-download-url (for Download) hit. Query:`, req.query, "User ID:", userId);

        const { s3Key } = req.query; // <<< s3Key क्वेरी पैरामीटर के रूप में अपेक्षित है

        if (!s3Key) {
            console.log("[s3Routes Download] Bad Request: Missing s3Key for download URL.");
            return res.status(400).json({ error: 's3Key query parameter is required for download URL.' });
        }
        if (!BUCKET_NAME) {
            console.error("[s3Routes Download] Server Error: AWS_S3_BUCKET_NAME not set.");
            return res.status(500).json({ error: 'Server configuration error: S3 bucket name not set.' });
        }

        try {
            console.log(`[s3Routes Download] Attempting to generate presigned DOWNLOAD URL for bucket: ${BUCKET_NAME}, key: ${s3Key}`);
            const downloadUrl = await getSignedUrl(
                BUCKET_NAME,
                s3Key,
                null,       // <<< getObject के लिए ContentType की आवश्यकता नहीं है
                'getObject',// <<< ऑपरेशन 'getObject' है
                300         // 5 मिनट में समाप्त होता है
            );
            console.log("[s3Routes Download] Successfully generated presigned DOWNLOAD URL:", downloadUrl);
            res.json({
                downloadUrl: downloadUrl // केवल डाउनलोड URL लौटाएं
            });
        } catch (error) {
            console.error(`[s3Routes Download] Error in getSignedUrl (getObject) for key ${s3Key}:`, error.message, error.stack);
            res.status(500).json({ error: `Failed to generate presigned download URL. Details: ${error.message}` });
        }
    }
);

module.exports = router;
console.log('[s3Routes.js] Router exported with upload and download URL generators.');

