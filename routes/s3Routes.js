// routes/s3Routes.js
const express = require('express');
const router = express.Router();
const { getSignedUrl } = require('../utils/s3Utils');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');

// Firebase Admin SDK को इम्पोर्ट करें। सुनिश्चित करें कि यह आपके प्रोजेक्ट में सही जगह पर है।
// यह आमतौर पर एक अलग फ़ाइल में इनिशियलाइज़ किया जाता है।
const { admin } = require('../utils/firebaseAdmin');

// शार्ट, यूनिक ID बनाने के लिए 'nanoid' लाइब्रेरी का उपयोग करें।
// इसे इनस्टॉल करें: npm install nanoid
const { customAlphabet } = require('nanoid');

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// ---------------------------------------------------------------------
// राउट 1: प्री-साइन्ड अपलोड URL जेनरेट करें
// ---------------------------------------------------------------------
router.get(
    '/generate-s3-upload-url',
    verifyFirebaseToken, // मिडलवेयर: सुनिश्चित करता है कि उपयोगकर्ता लॉग इन है
    async (req, res) => {
        // verifyFirebaseToken मिडलवेयर से हमें उपयोगकर्ता की UID मिलती है
        const userId = req.user.uid;
        // एंड्रॉइड ऐप से भेजे गए पैरामीटर्स
        const { fileName, fileType } = req.query;

        console.log(`[s3Routes] Request for upload URL received from user: ${userId}, file: ${fileName}`);

        if (!fileName || !fileType) {
            console.error("[s3Routes] Bad Request: fileName or fileType is missing.");
            return res.status(400).json({ error: 'fileName and fileType query parameters are required.' });
        }
        if (!BUCKET_NAME) {
            console.error("[s3Routes] Server Error: AWS_S3_BUCKET_NAME is not set in environment variables.");
            return res.status(500).json({ error: 'Server configuration error.' });
        }

        // सुरक्षा के लिए फ़ाइल नाम से विशेष वर्णों को हटाना
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        // S3 पर फ़ाइल का यूनिक पाथ बनाना: userId/timestamp_filename
        const s3Key = `${userId}/${Date.now()}_${sanitizedFileName}`;

        try {
            // 'putObject' ऑपरेशन के लिए एक अस्थायी URL जेनरेट करें जो 5 मिनट (300 सेकंड) में समाप्त हो जाएगा
            const uploadUrl = await getSignedUrl(BUCKET_NAME, s3Key, fileType, 'putObject', 300);

            console.log(`[s3Routes] Successfully generated presigned URL for key: ${s3Key}`);
            // एंड्रॉइड ऐप को URL और s3Key वापस भेजें
            res.status(200).json({
                uploadUrl: uploadUrl,
                s3Key: s3Key,
            });
        } catch (error) {
            console.error(`[s3Routes] Error generating presigned URL for ${s3Key}:`, error);
            res.status(500).json({ error: `Failed to generate presigned upload URL.` });
        }
    }
);

// ---------------------------------------------------------------------
// राउट 2: अपलोड की पुष्टि करें और डेटाबेस में सहेजें
// ---------------------------------------------------------------------
router.post(
    '/confirm-upload',
    verifyFirebaseToken, // मिडलवेयर: सुनिश्चित करता है कि उपयोगकर्ता लॉग इन है
    async (req, res) => {
        const userId = req.user.uid;
        // एंड्रॉइड ऐप से भेजी गई बॉडी
        const { s3Key, originalFileName, fileType, mimeType, sizeBytes } = req.body;

        console.log(`[s3Routes] Request to confirm upload received from user: ${userId}, key: ${s3Key}`);

        if (!s3Key || !originalFileName || !fileType || !mimeType || !sizeBytes) {
            console.error("[s3Routes] Bad Request: Missing required fields for confirmation.");
            return res.status(400).json({ error: 'Missing required fields for confirmation.' });
        }

        try {
            const db = admin.database();
            // Firebase में उपयोगकर्ता के डेटा के लिए सही पाथ चुनें
            const filesRef = db.ref(`users/${userId}/uploads/${fileType}s`); // जैसे 'images' या 'videos'
            const newFileRef = filesRef.push(); // Firebase से एक नई यूनिक ID जेनरेट करें

            // शेयर करने के लिए एक छोटा, यूनिक कोड जेनरेट करें (16 अक्षर)
            const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);
            const shortCode = nanoid();

            // डेटाबेस में सहेजने के लिए ऑब्जेक्ट तैयार करें
            const fileData = {
                id: newFileRef.key, // Firebase की यूनिक ID
                userId: userId,
                s3Bucket: BUCKET_NAME,
                s3Key: s3Key,
                title: originalFileName.split('.').slice(0, -1).join('.') || originalFileName, // फ़ाइल नाम से एक्सटेंशन हटाकर टाइटल बनाएं
                originalFileName: originalFileName,
                fileType: fileType, // 'image', 'video' आदि
                mimeType: mimeType, // 'image/jpeg', 'video/mp4' आदि
                sizeBytes: sizeBytes,
                shortCode: shortCode,
                uploadTimestamp: Date.now(),
            };

            // डेटा को Firebase में लिखें
            await newFileRef.set(fileData);

            console.log(`[s3Routes] Confirmed and saved file metadata to DB for user ${userId}: ${s3Key}`);
            res.status(201).json({ message: 'File metadata saved successfully.', fileData });

        } catch (error) {
            console.error(`[s3Routes] Error saving file metadata to DB for user ${userId}:`, error);
            res.status(500).json({ error: 'Failed to save file metadata.' });
        }
    }
);

// इस राउटर को एक्सपोर्ट करें ताकि इसे मुख्य सर्वर फ़ाइल (index.js) में उपयोग किया जा सके
module.exports = router;
