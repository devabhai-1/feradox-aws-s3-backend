// routes/s3Routes.js
const express = require('express');
const router = express.Router(); // बहुत महत्वपूर्ण: express.Router() का उपयोग करें
const { getSignedUrl } = require('../utils/s3Utils'); // सुनिश्चित करें कि '../utils/s3Utils' का पथ सही है

// वैकल्पिक: यदि आप Firebase प्रमाणीकरण का उपयोग कर रहे हैं
// const { verifyFirebaseToken } = require('../middleware/authMiddleware'); // सुनिश्चित करें कि पथ सही है

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

console.log('[s3Routes.js] File loaded and router instance created.'); // स्टार्टअप पर यह लॉग देखें

// GET /generate-presigned-url
// यह app.js में '/api' के साथ उपसर्गित होगा, इसलिए यह /api/generate-presigned-url बन जाएगा
router.get(
    '/generate-presigned-url',
    // verifyFirebaseToken, // <-- यदि आप प्रमाणीकरण का उपयोग कर रहे हैं तो इसे अनकमेंट करें
    async (req, res) => {
        // यदि प्रमाणीकरण सक्षम है, तो userId को req.user.uid से प्राप्त करें
        // const userId = req.user?.uid; // वैकल्पिक चेनिंग का उपयोग करें
        // यदि प्रमाणीकरण सक्षम नहीं है, तो आपको userId के लिए एक वैकल्पिक तरीका चाहिए या इसे कुंजी में उपयोग न करें
        const userId = req.user?.uid || 'anonymous-user'; // प्रमाणीकरण के बिना एक डिफ़ॉल्ट प्रदान करें (सावधान रहें)

        console.log(`[s3Routes] GET /generate-presigned-url hit. Query:`, req.query, "User ID:", userId);

        const { fileName, fileType } = req.query;

        if (!fileName || !fileType) {
            console.log("[s3Routes] Bad Request: Missing fileName or fileType.");
            return res.status(400).json({ error: 'fileName and fileType query parameters are required.' });
        }
        if (!BUCKET_NAME) {
            console.error("[s3Routes] Server Error: AWS_S3_BUCKET_NAME environment variable not set.");
            return res.status(500).json({ error: 'Server configuration error: S3 bucket name not set.' });
        }

        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-\s]/g, '_'); // विशेष वर्णों को हटा दें
        const s3Key = `${userId}/${Date.now()}_${sanitizedFileName}`;

        try {
            console.log(`[s3Routes] Attempting to generate presigned URL for bucket: ${BUCKET_NAME}, key: ${s3Key}, contentType: ${fileType}`);
            const uploadUrl = await getSignedUrl(
                BUCKET_NAME,
                s3Key,
                fileType,    // यह ContentType के रूप में पास किया जाएगा
                'putObject', // ऑपरेशन
                300          // 5 मिनट में समाप्त होता है
            );
            console.log("[s3Routes] Successfully generated presigned URL:", uploadUrl);
            res.json({
                uploadUrl: uploadUrl,
                s3Key: s3Key,
                originalFileName: fileName,
                s3Bucket: BUCKET_NAME
            });
        } catch (error) {
            console.error(`[s3Routes] Error in getSignedUrl for key ${s3Key}:`, error.message, error.stack);
            res.status(500).json({ error: `Failed to generate presigned URL. Details: ${error.message}` });
        }
    }
);

// सुनिश्चित करें कि यह लाइन अंत में है
module.exports = router;
console.log('[s3Routes.js] Router exported.'); // यह लॉग भी देखें
