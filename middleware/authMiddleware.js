// middleware/authMiddleware.js
const admin = require('../firebaseAdminSetup'); // firebaseAdminSetup.js का सही पथ

async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[AUTH] Failed: Token missing or format incorrect.');
    return res.status(401).json({ error: 'Unauthorized: Bearer token is required.' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // सत्यापित उपयोगकर्ता को रिक्वेस्ट में जोड़ें
    console.log(`[AUTH] Token verified for UID: ${decodedToken.uid}`);
    next(); // अगले चरण पर जाएं
  } catch (error) {
    console.error('[AUTH] Token verification error:', error.code, error.message);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please re-authenticate.' });
    }
    return res.status(401).json({ error: 'Invalid token. Authentication failed.' });
  }
}

module.exports = { verifyFirebaseToken };
