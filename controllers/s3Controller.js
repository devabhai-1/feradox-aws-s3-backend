// controllers/s3Controller.js
// ... (अन्य कोड)

exports.confirmUpload = async (req, res) => {
    console.log('[CONFIRM UPLOAD] Process started.'); // 1. प्रोसेस शुरू हुआ

    const userId = req.user.uid;
    const { s3Key, originalFileName, fileType, mimeType, sizeBytes } = req.body;

    if (!s3Key || !originalFileName || !fileType || !mimeType || !sizeBytes) {
        console.error('[CONFIRM UPLOAD] Bad Request: Missing required fields.');
        return res.status(400).json({ error: 'Missing required fields for confirmation.' });
    }

    try {
        console.log('[CONFIRM UPLOAD] Initializing Firebase database connection...'); // 2. Firebase शुरू
        const db = admin.database();
        console.log('[CONFIRM UPLOAD] Firebase database connection successful.'); // 3. Firebase सफल

        const dbPath = `users/${userId}/uploads/${fileType}s`;
        console.log(`[CONFIRM UPLOAD] Preparing to write to DB path: ${dbPath}`); // 4. DB पाथ

        const filesRef = db.ref(dbPath);
        const newFileRef = filesRef.push();

        // ... (fileData ऑब्जेक्ट बनाने का कोड) ...

        console.log('[CONFIRM UPLOAD] Setting data in Firebase...'); // 5. डेटा लिखने जा रहे हैं
        await newFileRef.set(fileData);
        console.log('[CONFIRM UPLOAD] Successfully saved metadata to DB.'); // 6. डेटा लिख दिया

        res.status(201).json({ message: 'File metadata saved successfully.', fileData });

    } catch (error) {
        // <<< यह सबसे महत्वपूर्ण लॉग है >>>
        console.error('[FATAL CRASH] Error during confirmUpload process:', error);
        // सर्वर क्रैश होने से पहले एक एरर रिस्पांस भेजें
        res.status(500).json({ error: 'Internal Server Error while confirming upload.', details: error.message });
    }
};

