// app.js
require('dotenv').config();
const express = require('express');
const s3Routes = require('./routes/s3Routes');

const app = express();
app.use(express.json());
app.use('/api', s3Routes);

app.get('/', (req, res) => res.status(200).send('Feradox S3 Backend is alive and running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[OK] Server is listening on port ${PORT}`));
