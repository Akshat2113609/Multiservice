const express = require('express');
const bodyParser = require('body-parser');
const blogRoutes = require('./routes/blogs');

const app = express();
app.use(bodyParser.json());
app.use('/blogs', blogRoutes);

const PORT = 5002;
app.listen(PORT, () => console.log(`Blog service running on port ${PORT}`));
