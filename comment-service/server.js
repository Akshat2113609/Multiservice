const express = require('express');
const bodyParser = require('body-parser');
const commentRoutes = require('./routes/comments');

const app = express();
app.use(bodyParser.json());
app.use('/comments', commentRoutes);

const PORT = 5003;
app.listen(PORT, () => console.log(`Comment service running on port ${PORT}`));
