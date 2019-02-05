const config = {
  development:
  {
    app: {
      port: 'Your port number',
      sessionSecret: 'SESSION_SECRET',
    },
    appBaseURL: 'app base url',
    secretString: 'Your secret',
  },
  production:
  {
    app: {
      port: 'Your port number',
      sessionSecret: 'SESSION_SECRET',
    },
    appBaseURL: 'app base url',
    secretString: 'Your secret',
  },
  test: {
    app: {
      port: 'Your port number',
      sessionSecret: 'SESSION_SECRET',
    },
    appBaseURL: 'app base url',
    secretString: 'Your secret',
  },
};
const env = process.env.NODE_ENV || 'development';
module.exports = config[env];
