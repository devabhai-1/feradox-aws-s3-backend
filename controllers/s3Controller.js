// controllers/s3Controller.js
const { getSignedUrl: generatePresignedUrl } = require('../utils/s3Utils');
const admin = require('../firebaseAdminSetup');
const { customAlphabet } = require('nanoid');

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

exports.generateUploadUrl = async (req, res) => {
    // ... (यह लॉजिक सही है, कोई बदलाव नहीं)
    const userId = req.user.uid;
    const { fileName, fileType } = req.query;
    if (!fileName || !fileType) return res.status(400).json({ error: 'fileName and fileType are required.' });
    if (!BUCKET_NAME) return res.status(500).json({ error: 'Server configuration error.' });

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const s3Key = `${userId}/${Date.now()}_${sanitizedFileName}`;
    try {
        const uploadUrl = await generatePresignedUrl(BUCKET_NAME, s3Key, fileType, 'putObject', 300);
        res.status(200).json({ uploadUrl, s3Key });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate presigned URL.' });
    }
};

exports.confirmUpload = async (req, res) => {
    // ... (यह लॉजिक भी सही है, कोई बदलाव नहीं)
    const userId = req.user.uid;
    const { s3Key, originalFileName, fileType, mimeType, sizeBytes } = req.body;
    if (!s3Key || !originalFileName || !fileType || !mimeType || !sizeBytes) return res.status(400).json({ error: 'Missing required fields for confirmation.' });

    try {
        const db = admin.database();
        const filesRef = db.ref(`users/${userId}/uploads/${fileType}s`);
        const newFileRef = filesRef.push();
        const shortCode = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16)();
        const fileData = { id: newFileRef.key, userId, s3Bucket: BUCKET_NAME, s3Key, title: originalFileName.split('.').slice(0, -1).join('.'), originalFileName, fileType, mimeType, sizeBytes, shortCode, uploadTimestamp: Date.now() };
        await newFileRef.set(fileData);
        res.status(201).json({ message: 'File metadata saved successfully.', fileData });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save file metadata to database.' });
    }
};
