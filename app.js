const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const routes = require('./api/routes/index.js');
const config = require('./api/config/config.js');
const passportSetup = require('./api/utils/passport');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: config.app.sessionSecret,
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

passportSetup(passport);

app.use(routes);

app.listen(config.app.port, () => {
  console.log(`Server started on port ${config.app.port}`);
});
