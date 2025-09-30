// utils/s3Utils.js
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl: awsGetSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: process.env.AWS_REGION, // सुनिश्चित करें कि .env में AWS_REGION सेट है
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // सुनिश्चित करें कि .env में AWS_ACCESS_KEY_ID सेट है
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // सुनिश्चित करें कि .env में AWS_SECRET_ACCESS_KEY सेट है
  },
});

/**
 * S3 ऑपरेशन के लिए एक presigned URL उत्पन्न करता है।
 * @param {string} bucket बकेट का नाम।
 * @param {string} key ऑब्जेक्ट की कुंजी।
 * @param {string} contentType फ़ाइल का Content-Type (MIME प्रकार) - PUT के लिए महत्वपूर्ण।
 * @param {string} operation 'getObject' या 'putObject'.
 * @param {number} expiresInSecond सेकंड में समाप्ति समय (डिफ़ॉल्ट 300 = 5 मिनट)।
 * @returns {Promise<string>} Presigned URL.
 */
async function getSignedUrl(bucket, key, contentType, operation = 'getObject', expiresInSecond = 300) {
  let command;
  let params = { Bucket: bucket, Key: key };

  if (operation === 'putObject') {
    if (!contentType) {
      throw new Error("putObject ऑपरेशन के लिए ContentType आवश्यक है।");
    }
    params.ContentType = contentType;
    command = new PutObjectCommand(params);
  } else if (operation === 'getObject') {
    command = new GetObjectCommand(params);
  } else {
    throw new Error(`असमर्थित ऑपरेशन: ${operation}. 'getObject' या 'putObject' का उपयोग करें।`);
  }

  try {
    const signedUrl = await awsGetSignedUrl(s3Client, command, { expiresIn: expiresInSecond });
    return signedUrl;
  } catch (error) {
    console.error(`S3 ${operation} के लिए हस्ताक्षरित URL उत्पन्न करने में त्रुटि (कुंजी: ${key}):`, error);
    throw error; // त्रुटि को पुनः फेंकें ताकि कंट्रोलर इसे पकड़ सके
  }
}

module.exports = { getSignedUrl };
