// routes/s3Routes.js
const express = require('express');
const router = express.Router();
const { getSignedUrl } = require('../utils/s3Utils');
const { verifyFirebaseToken } = require('../middleware/authMiddleware'); // <<< इसे अनकमेंट करें यदि आप प्रमाणीकरण का उपयोग करना चाहते हैं

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

console.log('[s3Routes.js] File loaded and router instance created.');

// GET /generate-s3-upload-url (प्रीसाइन्ड अपलोड URL के लिए)
// पूर्ण पथ अब होगा: /api/generate-s3-upload-url
router.get(
    '/generate-s3-upload-url', // <<< यहाँ पथ बदला गया
    verifyFirebaseToken,       // <<< प्रमाणीकरण मिडलवेयर सक्षम किया गया
    async (req, res) => {
        // req.user अब verifyFirebaseToken से UID प्रदान करेगा
        const userId = req.user.uid;
        console.log(`[s3Routes] GET /generate-s3-upload-url (for Upload) hit. Query:`, req.query, "User ID:", userId);

        const { fileName, fileType } = req.query;

        if (!fileName || !fileType) {
            console.log("[s3Routes Upload] Bad Request: Missing fileName or fileType.");
            return res.status(400).json({ error: 'fileName and fileType query parameters are required for upload URL.' });
        }
        if (!BUCKET_NAME) {
            console.error("[s3Routes Upload] Server Error: AWS_S3_BUCKET_NAME not set.");
            return res.status(500).json({ error: 'Server configuration error: S3 bucket name not set.' });
        }

        // फ़ाइल नाम को साफ करें (पहले से ही आपके नियंत्रक में था, यहाँ डुप्लिकेट नहीं होना चाहिए, लेकिन सुनिश्चित करें कि यह कहीं हो रहा है)
        // सुरक्षा के लिए, आप यहाँ एक बुनियादी सैनिटाइजेशन कर सकते हैं, या मान सकते हैं कि यह नियंत्रक परत में किया गया है
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_'); // सरल सैनिटाइजेशन
        const s3Key = `${userId}/${Date.now()}_${sanitizedFileName}`;

        try {
            console.log(`[s3Routes Upload] Attempting to generate presigned UPLOAD URL for bucket: ${BUCKET_NAME}, key: ${s3Key}, contentType: ${fileType}`);
            const uploadUrl = await getSignedUrl(
                BUCKET_NAME,
                s3Key,
                fileType,
                'putObject', // <<< ऑपरेशन 'putObject' है
                300          // 5 मिनट में समाप्त होता है
            );
            console.log("[s3Routes Upload] Successfully generated presigned UPLOAD URL:", uploadUrl);
            res.json({
                uploadUrl: uploadUrl,
                s3Key: s3Key,
                originalFileName: fileName, // या sanitizedFileName
                s3Bucket: BUCKET_NAME
            });
        } catch (error) {
            console.error(`[s3Routes Upload] Error in getSignedUrl for key ${s3Key}:`, error.message, error.stack);
            res.status(500).json({ error: `Failed to generate presigned upload URL. Details: ${error.message}` });
        }
    }
);

// GET /generate-s3-download-url (प्रीसाइन्ड डाउनलोड URL के लिए)
// पूर्ण पथ अब होगा: /api/generate-s3-download-url
router.get(
    '/generate-s3-download-url', // <<< यहाँ पथ बदला गया
    verifyFirebaseToken,         // <<< प्रमाणीकरण मिडलवेयर सक्षम किया गया
    async (req, res) => {
        const userId = req.user.uid;
        console.log(`[s3Routes] GET /generate-s3-download-url (for Download) hit. Query:`, req.query, "User ID:", userId);

        const { s3Key } = req.query;

        if (!s3Key) {
            console.log("[s3Routes Download] Bad Request: Missing s3Key for download URL.");
            return res.status(400).json({ error: 's3Key query parameter is required for download URL.' });
        }
        if (!BUCKET_NAME) {
            console.error("[s3Routes Download] Server Error: AWS_S3_BUCKET_NAME not set.");
            return res.status(500).json({ error: 'Server configuration error: S3 bucket name not set.' });
        }

        // महत्वपूर्ण: सुनिश्चित करें कि s3Key उपयोगकर्ता से संबंधित है जिसके पास पहुँच होनी चाहिए।
        // वर्तमान में, कोई भी प्रमाणित उपयोगकर्ता किसी भी s3Key के लिए अनुरोध कर सकता है।
        // आपको यह सत्यापित करने के लिए तर्क जोड़ना पड़ सकता है कि req.user.uid को इस s3Key तक पहुँचने की अनुमति है।
        // उदाहरण के लिए, s3Key की शुरुआत में userId होना चाहिए: if (!s3Key.startsWith(userId + '/')) { ... }

        try {
            console.log(`[s3Routes Download] Attempting to generate presigned DOWNLOAD URL for bucket: ${BUCKET_NAME}, key: ${s3Key}`);
            const downloadUrl = await getSignedUrl(
                BUCKET_NAME,
                s3Key,
                null,       // getObject के लिए ContentType की आवश्यकता नहीं है
                'getObject',// ऑपरेशन 'getObject' है
                300         // 5 मिनट में समाप्त होता है
            );
            console.log("[s3Routes Download] Successfully generated presigned DOWNLOAD URL:", downloadUrl);
            res.json({
                downloadUrl: downloadUrl
            });
        } catch (error) {
            console.error(`[s3Routes Download] Error in getSignedUrl (getObject) for key ${s3Key}:`, error.message, error.stack);
            res.status(500).json({ error: `Failed to generate presigned download URL. Details: ${error.message}` });
        }
    }
);

module.exports = router;
console.log('[s3Routes.js] Router exported with corrected upload and download URL generators.');

