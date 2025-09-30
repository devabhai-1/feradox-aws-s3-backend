// firebaseAdminSetup.js
const admin = require('firebase-admin');

// सुनिश्चित करें कि './serviceAccountKey.json' आपकी डाउनलोड की गई और
// प्रोजेक्ट रूट में रखी गई सेवा खाता कुंजी फ़ाइल का सही नाम और पथ है।
try {
  const serviceAccount = require('./serviceAccountKey.json'); // महत्वपूर्ण: अपनी फ़ाइल का सही नाम उपयोग करें

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
    // यदि आप Realtime Database आदि का उपयोग कर रहे हैं, तो यहां कॉन्फ़िगरेशन जोड़ें:
    // databaseURL: "https://<YOUR-PROJECT-ID>.firebaseio.com"
  });

  console.log('Firebase Admin SDK सफलतापूर्वक प्रारंभ किया गया।');
} catch (error) {
  console.error('Firebase Admin SDK प्रारंभ करने में त्रुटि:', error);
  console.error('कृपया सुनिश्चित करें कि "serviceAccountKey.json" (या आपके द्वारा उपयोग किया जा रहा सही नाम) प्रोजेक्ट की रूट डायरेक्टरी में मौजूद है और सही प्रारूप में है।');
  process.exit(1); // त्रुटि होने पर एप्लिकेशन बंद करें
}

module.exports = admin;
