// firebaseAdminSetup.js
const admin = require('firebase-admin');

let serviceAccountJsonString;
let serviceAccount;

// पहले Render.com (या किसी अन्य होस्टिंग) पर सेट पर्यावरण चर से पढ़ने का प्रयास करें
if (process.env.FIREBASE_SERVICE_ACCOUNT_CREDENTIALS) {
  serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_CREDENTIALS;
  console.log('पर्यावरण चर FIREBASE_SERVICE_ACCOUNT_CREDENTIALS से Firebase सेवा खाता क्रेडेंशियल लोड हो रहे हैं।');
  try {
    serviceAccount = JSON.parse(serviceAccountJsonString);
  } catch (e) {
    console.error('FIREBASE_SERVICE_ACCOUNT_CREDENTIALS पर्यावरण चर को JSON के रूप में पार्स करने में त्रुटि:', e);
    console.error('कृपया सुनिश्चित करें कि पर्यावरण चर में मान्य JSON स्ट्रिंग है।');
    process.exit(1); // त्रुटि पर बाहर निकलें
  }
} else {
  // यदि पर्यावरण चर सेट नहीं है (जैसे स्थानीय विकास के दौरान),
  // तो स्थानीय फ़ाइल से लोड करने का प्रयास करें
  console.log('स्थानीय serviceAccountKey.json फ़ाइल से Firebase सेवा खाता क्रेडेंशियल लोड करने का प्रयास किया जा रहा है।');
  try {
    // सुनिश्चित करें कि यह फ़ाइल आपके प्रोजेक्ट की रूट में है और `.gitignore` में है
    serviceAccount = require('./serviceAccountKey.json');
  } catch (e) {
    console.error('./serviceAccountKey.json फ़ाइल लोड करने में त्रुटि:', e);
    console.error('सुनिश्चित करें कि "serviceAccountKey.json" फ़ाइल प्रोजेक्ट की रूट में मौजूद है (स्थानीय विकास के लिए) या FIREBASE_SERVICE_ACCOUNT_CREDENTIALS पर्यावरण चर उत्पादन के लिए सेट है।');
    process.exit(1); // त्रुटि पर बाहर निकलें
  }
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
    // databaseURL: "https://<YOUR_PROJECT_ID>.firebaseio.com" // यदि आवश्यक हो
  });
  console.log('Firebase Admin SDK सफलतापूर्वक प्रारंभ किया गया।');
} catch (error) {
  console.error('Firebase Admin SDK प्रारंभ करने में अंतिम त्रुटि:', error);
  process.exit(1);
}

module.exports = admin;

