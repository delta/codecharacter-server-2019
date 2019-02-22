const config = {
  development: {
    app: {
      port: 'Your port number',
      sessionSecret: 'SESSION_SECRET',
    },
    appBaseURL: 'app base url',
    secretString: 'Your secret',
    event: {
      event_id: 5,
      event_key: 'somekey',
    },
    sendgridAPIKey: 'key',
  },
  production: {
    app: {
      port: 'Your port number',
      sessionSecret: 'SESSION_SECRET',
    },
    appBaseURL: 'app base url',
    secretString: 'Your secret',
    event: {
      event_id: 5,
      event_key: 'somekey',
    },
    sendgridAPIKey: 'key',
  },
  test: {
    app: {
      port: 'Your port number',
      sessionSecret: 'SESSION_SECRET',
    },
    appBaseURL: 'app base url',
    secretString: 'Your secret',
    event: {
      event_id: 5,
      event_key: 'somekey',
    },
    sendgridAPIKey: 'key',
  },
};
const env = process.env.NODE_ENV || 'development';
module.exports = config[env];
