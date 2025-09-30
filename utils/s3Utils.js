// utils/s3Utils.js
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl: awsGetSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

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
    throw error;
  }
}

module.exports = { getSignedUrl };
