const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl: awsGetSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function getSignedUrl(bucket, key) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return await awsGetSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes
}

module.exports = { getSignedUrl };