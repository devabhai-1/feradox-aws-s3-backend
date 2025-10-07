// controllers/s3Controller.js
const { getSignedUrl: generatePresignedUrl } = require('../utils/s3Utils');
const admin = require('../firebaseAdminSetup');
const { customAlphabet } = require('nanoid');

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// --- कंट्रोलर 1: प्री-साइन्ड URL जेनरेट करें ---
// <<< सुनिश्चित करें कि यह 'exports.generateUploadUrl' है >>>
exports.generateUploadUrl = async (req, res) => {
    const userId = req.user.uid;
    const { fileName, fileType } = req.query;

    if (!fileName || !fileType) return res.status(400).json({ error: 'fileName and fileType are required.' });
    if (!BUCKET_NAME) return res.status(500).json({ error: 'Server configuration error: BUCKET_NAME is not set.' });

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const s3Key = `${userId}/${Date.now()}_${sanitizedFileName}`;

    try {
        const uploadUrl = await generatePresignedUrl(BUCKET_NAME, s3Key, fileType, 'putObject', 300);
        console.log(`[CONTROLLER] Generated upload URL for s3Key: ${s3Key}`);
        res.status(200).json({ uploadUrl, s3Key });
    } catch (error) {
        console.error(`[CONTROLLER] Error generating presigned URL:`, error);
        res.status(500).json({ error: 'Failed to generate presigned URL.' });
    }
};

// --- कंट्रोलर 2: अपलोड की पुष्टि करें ---
// <<< सुनिश्चित करें कि यह 'exports.confirmUpload' है >>>
exports.confirmUpload = async (req, res) => {
    const userId = req.user.uid;
    const { s3Key, originalFileName, fileType, mimeType, sizeBytes } = req.body;

    if (!s3Key || !originalFileName || !fileType || !mimeType || !sizeBytes) {
        return res.status(400).json({ error: 'Missing required fields for confirmation.' });
    }

    try {
        const db = admin.database();
        const filesRef = db.ref(`users/${userId}/uploads/${fileType}s`);
        const newFileRef = filesRef.push();
        const shortCode = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16)();
        const fileData = { id: newFileRef.key, userId, s3Bucket: BUCKET_NAME, s3Key, title: originalFileName.split('.').slice(0, -1).join('.'), originalFileName, fileType, mimeType, sizeBytes, shortCode, uploadTimestamp: Date.now() };

        await newFileRef.set(fileData);
        console.log(`[CONTROLLER] Successfully saved metadata to DB for s3Key: ${s3Key}`);
        res.status(201).json({ message: 'File metadata saved successfully.', fileData });
    } catch (error) {
        console.error(`[CONTROLLER] Error saving metadata to DB:`, error);
        res.status(500).json({ error: 'Failed to save file metadata to database.' });
    }
};
