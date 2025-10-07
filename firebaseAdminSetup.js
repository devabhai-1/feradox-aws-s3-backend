// firebaseAdminSetup.js
const admin = require('firebase-admin');

// --- यह बहुत महत्वपूर्ण है ---
// अपने Realtime Database का URL यहाँ डालें।
// यह Firebase कंसोल -> Realtime Database में मिलेगा।
const DATABASE_URL = "https://telegramwebkundan-default-rtdb.firebaseio.com";

if (!DATABASE_URL) {
    console.error('[FATAL ERROR] databaseURL is not set in firebaseAdminSetup.js!');
    process.exit(1);
}

try {
    // यह Render.com पर Secret File (या आपके स्थानीय .env) और लोकल फ़ाइल दोनों से काम करेगा।
    // Render.com के लिए, serviceAccountKey.json के कंटेंट को एक Secret File में डालें।
    const serviceAccount = require('./serviceAccountKey.json');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: DATABASE_URL
    });

    console.log('[OK] Firebase Admin SDK initialized successfully.');

} catch (error) {
    console.error('[FATAL ERROR] Initializing Firebase Admin SDK failed:', error.message);
    console.error('Please ensure "serviceAccountKey.json" exists for local development, or the Secret File is correctly set on Render.com.');
    process.exit(1); // इसके बिना सर्वर नहीं चल सकता।
}

// इनिशियलाइज़ किए गए एडमिन ऑब्जेक्ट को एक्सपोर्ट करें
module.exports = admin;
