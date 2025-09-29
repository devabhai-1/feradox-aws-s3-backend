const { getSignedUrl } = require('../utils/s3Utils');

const tokenToS3Map = {
  'abc': 'dummy_data/Round 2 Solution.pdf',
  'def': 'dummy_data/Interview Question.pdf',
  // Add more mappings as needed
};

exports.getSignedUrl = async (req, res) => {
  const { token } = req.query;
  if (!token || !tokenToS3Map[token]) {
    return res.status(400).json({ error: 'Invalid token' });
  }
  try {
    const bucket = process.env.AWS_S3_BUCKET_NAME;
    const key = tokenToS3Map[token];
    const url = await getSignedUrl(bucket, key);
    res.json({ signedUrl: url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate URL' });
  }
};