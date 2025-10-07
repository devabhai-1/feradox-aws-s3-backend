// firebaseAdminSetup.js
const admin = require('firebase-admin');

// अपने Realtime Database का URL यहाँ डालें
const DATABASE_URL = "https://telegramwebkundan-default-rtdb.firebaseio.com";

if (!DATABASE_URL.startsWith('https://')) {
    console.error('[FATAL ERROR] DATABASE_URL is not set correctly in firebaseAdminSetup.js!');
    process.exit(1);
}

try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: DATABASE_URL
    });
    console.log('[OK] Firebase Admin SDK initialized successfully.');
} catch (error) {
    console.error('[FATAL ERROR] Initializing Firebase Admin SDK failed:', error.message);
    process.exit(1);
}

module.exports = admin;
