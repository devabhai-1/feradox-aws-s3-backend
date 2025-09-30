// routes/s3Routes.js
const express = require('express');
const router = express.Router();
const { getSignedUrl } = require('../utils/s3Utils'); // सुनिश्चित करें कि पथ सही है
const { verifyFirebaseToken } = require('../middleware/authMiddleware'); // यदि आप प्रमाणीकरण का उपयोग कर रहे हैं

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// यह राउट अब /api/generate-presigned-url के रूप में एक्सेस किया जाएगा
router.get('/generate-presigned-url', verifyFirebaseToken, async (req, res) => {
    const { fileName, fileType } = req.query;
    const userId = req.user.uid; // verifyFirebaseToken से

    if (!fileName || !fileType) {
        return res.status(400).json({ error: 'fileName and fileType query parameters are required.' });
    }
    if (!BUCKET_NAME) {
        console.error("AWS_S3_BUCKET_NAME पर्यावरण चर सेट नहीं है।");
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-\s]/g, '_');
    const s3Key = `${userId}/${Date.now()}_${sanitizedFileName}`;

    try {
        const uploadUrl = await getSignedUrl(
            BUCKET_NAME,
            s3Key,
            fileType,
            'putObject',
            300
        );
        res.json({
            uploadUrl: uploadUrl,
            s3Key: s3Key,
            originalFileName: fileName,
            s3Bucket: BUCKET_NAME
        });
    } catch (error) {
        console.error("Presigned URL उत्पन्न करने में त्रुटि:", error);
        res.status(500).json({ error: 'Failed to generate presigned URL.' });
    }
});

module.exports = router;
