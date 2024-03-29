const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  transports: ['websocket'],
});
const cookieParser = require('cookie-parser');

const routes = require('./api/routes/index.js');
const config = require('./api/config/config.js');
const passportSetup = require('./api/utils/passport');
const socketUtils = require('./api/utils/socketHandlers');
const compileBoxUtils = require('./api/utils/compileBox');
const { startJobs } = require('./api/utils/job');

global.appPath = path.resolve(__dirname);

const corsOptions = {
  origin: config.appBaseURL,
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
  allowedHeaders: ['X-Requested-With', 'X-HTTP-Method-Override', 'Content-Type', 'Accept'],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(
  session({
    secret: config.app.sessionSecret,
    resave: false,
    saveUninitialized: true,
  }),
);

compileBoxUtils.initializeCompileBoxes();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());

passportSetup(passport);

app.use(routes);
startJobs();
server.listen(config.app.port);

// socket handler functions
io.sockets.on('connection', socketUtils.handleConnections);

module.exports = app;
