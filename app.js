const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const config = require('./api/config/config.js');
const routes = require('./api/routes/index.js');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

//= =ROUTES==

app.use(routes);

app.listen(config.port, () => {
  console.log(`Server started on port ${config.port}`);
});
