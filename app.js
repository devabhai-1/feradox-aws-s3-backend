require('dotenv').config();
const express = require('express');
const s3Routes = require('./routes/s3Routes');

const app = express();
app.use(express.json());
app.use('/api', s3Routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));