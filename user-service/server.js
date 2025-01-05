const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');

const app = express();
app.use(bodyParser.json());
app.use('/auth', authRoutes);

const PORT = 5001;
app.listen(PORT, () => console.log(`User service running on port ${PORT}`));
