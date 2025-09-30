// middleware/authMiddleware.js
const admin = require('../firebaseAdminSetup'); // firebaseAdminSetup.js का सही पथ

async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('प्रमाणीकरण विफल: टोकन नहीं मिला या Bearer प्रारूप गलत है। हेडर:', authHeader);
    return res.status(401).json({ error: 'Unauthorized: ID token is required in Bearer format.' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // सत्यापित उपयोगकर्ता जानकारी को अनुरोध ऑब्जेक्ट में संलग्न करें
    console.log(`Firebase टोकन सफलतापूर्वक सत्यापित। उपयोगकर्ता: ${decodedToken.email || 'N/A'}, UID: ${decodedToken.uid}`);
    next(); // टोकन मान्य है, अगले हैंडलर पर जाएं
  } catch (error) {
    console.error('Firebase ID टोकन सत्यापन में त्रुटि:', error);
    let errorMessage = 'Invalid token. Authentication failed.';
    let errorCode = error.code || 'UNKNOWN_AUTH_ERROR';

    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Token expired. Please re-authenticate.';
    } else if (error.code === 'auth/argument-error') {
      errorMessage = 'Token verification failed due to an argument error (possibly malformed token).';
    }
    // आप यहां अन्य विशिष्ट Firebase त्रुटि कोड हैंडल कर सकते हैं

    return res.status(401).json({ error: errorMessage, code: errorCode, details: error.message });
  }
}

module.exports = { verifyFirebaseToken };
