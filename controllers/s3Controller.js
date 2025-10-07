// controllers/s3Controller.js
const { getSignedUrl: generatePresignedUrl } = require('../utils/s3Utils');
const admin = require('../firebaseAdminSetup'); // सही इम्पोर्ट
const { customAlphabet } = require('nanoid');

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// --- कंट्रोलर 1: प्री-साइन्ड URL जेनरेट करें ---
exports.generateUploadUrl = async (req, res) => {
    const userId = req.user.uid;
    const { fileName, fileType } = req.query;

    console.log(`[CONTROLLER] Received request for upload URL from UID: ${userId}`);

    if (!fileName || !fileType) {
        return res.status(400).json({ error: 'fileName and fileType query parameters are required.' });
    }
    if (!BUCKET_NAME) {
        console.error('[FATAL ERROR] AWS_S3_BUCKET_NAME environment variable is not set.');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const s3Key = `${userId}/${Date.now()}_${sanitizedFileName}`;

    try {
        const uploadUrl = await generatePresignedUrl(BUCKET_NAME, s3Key, fileType, 'putObject', 300); // 5 मिनट के लिए URL
        console.log(`[CONTROLLER] Successfully generated upload URL for s3Key: ${s3Key}`);
        res.status(200).json({
            uploadUrl: uploadUrl,
            s3Key: s3Key,
        });
    } catch (error) {
        console.error(`[CONTROLLER] Error generating presigned URL:`, error);
        res.status(500).json({ error: 'Failed to generate presigned URL.' });
    }
};

// --- कंट्रोलर 2: अपलोड की पुष्टि करें और DB में सेव करें (यह हिस्सा गायब था) ---
exports.confirmUpload = async (req, res) => {
    const userId = req.user.uid;
    const { s3Key, originalFileName, fileType, mimeType, sizeBytes } = req.body;

    console.log(`[CONTROLLER] Received request to confirm upload from UID: ${userId}`);

    if (!s3Key || !originalFileName || !fileType || !mimeType || !sizeBytes) {
        return res.status(400).json({ error: 'Missing required fields for confirmation: s3Key, originalFileName, fileType, mimeType, sizeBytes are all required.' });
    }

    try {
        const db = admin.database();
        const filesRef = db.ref(`users/${userId}/uploads/${fileType}s`); // जैसे users/uid/uploads/images
        const newFileRef = filesRef.push(); // Firebase से नई यूनिक ID

        const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);
        const shortCode = nanoid();

        const fileData = {
            id: newFileRef.key,
            userId: userId,
            s3Bucket: BUCKET_NAME,
            s3Key: s3Key,
            title: originalFileName.split('.').slice(0, -1).join('.') || originalFileName,
            originalFileName: originalFileName,
            fileType: fileType,
            mimeType: mimeType,
            sizeBytes: sizeBytes,
            shortCode: shortCode,
            uploadTimestamp: Date.now(),
        };

        await newFileRef.set(fileData);

        console.log(`[CONTROLLER] Successfully saved metadata to DB for s3Key: ${s3Key}`);
        res.status(201).json({ message: 'File metadata saved successfully.', fileData });

    } catch (error) {
        console.error(`[CONTROLLER] Error saving metadata to DB:`, error);
        res.status(500).json({ error: 'Failed to save file metadata to database.' });
    }
};
