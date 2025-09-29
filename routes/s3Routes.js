const express = require('express');
const s3Controller = require('../controllers/s3Controller');

const router = express.Router();
router.get('/get-url', s3Controller.getSignedUrl);

module.exports = router;