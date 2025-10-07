// middleware/authMiddleware.js
const admin = require('../firebaseAdminSetup');

async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Bearer token is required.' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    req.user = await admin.auth().verifyIdToken(idToken);
    next();
  } catch (error) {
    console.error('[AUTH] Token verification error:', error.code);
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

module.exports = { verifyFirebaseToken };
