// controllers/s3Controller.js
const { getSignedUrl: generateS3PresignedUrlForUpload } = require('../utils/s3Utils'); // सुनिश्चित करें कि यह utils में आपके फ़ंक्शन से मेल खाता है

exports.getSignedUrl = async (req, res) => {
  // req.user में अब सत्यापित Firebase उपयोगकर्ता की जानकारी है (authMiddleware से)
  const userId = req.user.uid; // Firebase उपयोगकर्ता UID
  console.log(`उपयोगकर्ता ${userId} के लिए हस्ताक्षरित URL का अनुरोध।`);

  const { fileName, fileType } = req.query; // Android ऐप से अपेक्षित क्वेरी पैरामीटर

  if (!fileName || !fileType) {
    console.warn('Bad Request: fileName या fileType क्वेरी पैरामीटर गायब हैं।', req.query);
    return res.status(400).json({ error: 'Bad Request: Missing fileName or fileType query parameters.' });
  }

  // सुरक्षा उपाय: फ़ाइल नाम को साफ करें (sanitize)
  // यह एक बहुत ही बुनियादी सैनिटाइजेशन है। उत्पादन के लिए अधिक मजबूत सत्यापन की आवश्यकता हो सकती है।
  // केवल अल्फान्यूमेरिक, अंडरस्कोर, हाइफ़न, डॉट, स्पेस और कोष्ठक की अनुमति दें। अन्य सभी को '_' से बदलें।
  const safeOriginalFileName = fileName.replace(/[^a-zA-Z0-9_.\- ()]/g, '_').trim();

  if (!safeOriginalFileName) {
      console.warn('Bad Request: सैनिटाइजेशन के बाद फ़ाइल का नाम खाली है। मूल:', fileName);
      return res.status(400).json({ error: 'Bad Request: File name is invalid after sanitization.' });
  }

  // S3 कुंजी (key) तय करें। उपयोगकर्ता-विशिष्ट फ़ोल्डर और विशिष्टता के लिए टाइमस्टैम्प का उपयोग करें।
  const s3Key = `${userId}/${Date.now()}_${safeOriginalFileName}`;

  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  if (!bucketName) {
    console.error('त्रुटि: AWS_S3_BUCKET_NAME पर्यावरण चर सेट नहीं है।');
    return res.status(500).json({ error: 'Internal Server Error: S3 bucket configuration missing.' });
  }

  try {
    // utils/s3Utils.js में परिभाषित फ़ंक्शन को कॉल करें
    // यह फ़ंक्शन PUT ऑपरेशन के लिए एक presigned URL उत्पन्न करना चाहिए
    const operation = 'putObject'; // हम एक फ़ाइल अपलोड (PUT) करना चाहते हैं
    const presignedUrl = await generateS3PresignedUrlForUpload(bucketName, s3Key, fileType, operation);

    console.log(`S3 कुंजी के लिए हस्ताक्षरित URL सफलतापूर्वक उत्पन्न: ${s3Key}`);
    
    // Android ऐप को निम्नलिखित जानकारी की आवश्यकता होगी:
    res.json({
      uploadUrl: presignedUrl,    // S3 पर अपलोड करने के लिए PUT URL
      s3Key: s3Key,               // S3 में फ़ाइल की कुंजी
      s3Bucket: bucketName,       // S3 बकेट का नाम
      originalFileName: safeOriginalFileName // मूल (या सुरक्षित) फ़ाइल नाम (मेटाडेटा के लिए उपयोगी)
    });
  } catch (error) {
    console.error(`S3 कुंजी ${s3Key} के लिए हस्ताक्षरित URL उत्पन्न करने में त्रुटि:`, error);
    res.status(500).json({ error: 'Internal Server Error: Failed to generate signed URL.', details: error.message });
  }
};
