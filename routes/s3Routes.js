// routes/s3Routes.js
        const express = require('express');
        const router = express.Router(); // express.Router() का उपयोग करें
        const { getSignedUrl } = require('../utils/s3Utils');
        const { verifyFirebaseToken } = require('../middleware/authMiddleware'); // या जो भी आपका प्रमाणीकरण मिडलवेयर है

        const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

        // GET /generate-presigned-url
        // यह app.js में '/api' के साथ उपसर्गित होगा, इसलिए यह /api/generate-presigned-url बन जाएगा
        router.get('/generate-presigned-url', verifyFirebaseToken, async (req, res) => {
            console.log(`[s3Routes] Received request for /generate-presigned-url with query:`, req.query); // अतिरिक्त लॉगिंग
            const { fileName, fileType } = req.query;
            const userId = req.user.uid;

            if (!fileName || !fileType) {
                console.log("[s3Routes] Missing fileName or fileType");
                return res.status(400).json({ error: 'fileName and fileType query parameters are required.' });
            }
            if (!BUCKET_NAME) {
                console.error("[s3Routes] AWS_S3_BUCKET_NAME environment variable not set.");
                return res.status(500).json({ error: 'Server configuration error: S3 bucket name not set.' });
            }

            const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-\s]/g, '_');
            const s3Key = `${userId}/${Date.now()}_${sanitizedFileName}`;

            try {
                console.log(`[s3Routes] Generating presigned URL for bucket: ${BUCKET_NAME}, key: ${s3Key}, type: ${fileType}`);
                const uploadUrl = await getSignedUrl(
                    BUCKET_NAME,
                    s3Key,
                    fileType,
                    'putObject',
                    300
                );
                console.log("[s3Routes] Presigned URL generated successfully:", uploadUrl);
                res.json({
                    uploadUrl: uploadUrl,
                    s3Key: s3Key,
                    originalFileName: fileName,
                    s3Bucket: BUCKET_NAME
                });
            } catch (error) {
                console.error(`[s3Routes] Error generating presigned URL for key ${s3Key}:`, error.message, error.stack);
                res.status(500).json({ error: `Failed to generate presigned URL. ${error.message}` });
            }
        });

        module.exports = router; // सुनिश्चित करें कि आप राउटर को निर्यात कर रहे हैं
        
