// app.js
require('dotenv').config(); // सुनिश्चित करें कि यह सबसे ऊपर है
const express = require('express');
const s3Routes = require('./routes/s3Routes');

const app = express();

// यह मिडलवेयर आने वाली JSON रिक्वेस्ट की बॉडी (req.body) को पढ़ने के लिए अनिवार्य है।
app.use(express.json());

// '/api' से शुरू होने वाली सभी रिक्वेस्ट को s3Routes पर भेजें।
app.use('/api', s3Routes);

// एक बेसिक रूट, यह जांचने के लिए कि सर्वर चल रहा है या नहीं।
app.get('/', (req, res) => {
    res.status(200).send('Feradox S3 Backend is alive and running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[OK] Server is listening on port ${PORT}`));
