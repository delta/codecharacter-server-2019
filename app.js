const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const cookieParser = require('cookie-parser');

const routes = require('./api/routes/index.js');
const config = require('./api/config/config.js');
const passportSetup = require('./api/utils/passport');
const socketUtils = require('./api/utils/socketHandlers');

global.appPath = path.resolve(__dirname);

app.use(
  session({
    secret: config.app.sessionSecret,
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(bodyParser.json());
app.use(cookieParser());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passportSetup(passport);

app.use(routes);

server.listen(config.app.port);

// socket handler functions
io.sockets.on('connection', socketUtils.handleConnections);

module.exports = app;
