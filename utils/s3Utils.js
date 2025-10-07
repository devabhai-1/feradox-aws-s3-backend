// utils/s3Utils.js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl: awsGetSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function getSignedUrl(bucket, key, contentType, operation, expiresIn = 300) {
  const params = { Bucket: bucket, Key: key };
  if (operation === 'putObject') {
    params.ContentType = contentType;
  }
  // PutObjectCommand S3 v3 SDK में GetObject और PutObject दोनों के लिए presigned URL बना सकता है।
  const command = new PutObjectCommand(params);
  return await awsGetSignedUrl(s3Client, command, { expiresIn });
}

module.exports = { getSignedUrl };
