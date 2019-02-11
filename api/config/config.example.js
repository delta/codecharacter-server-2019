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
    facebook: {
      client_id: 'YOUR APP ID',
      client_secret: 'YOUR APP SECRET',
      callback_url: '{API URL}/user/callback/facebook',
    },
    google: {
      client_id: 'YOUR APP ID',
      client_secret: 'YOUR APP SECRET',
      callback_url: '{API URL}/user/callback/google',
    },
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
    facebook: {
      client_id: 'YOUR APP ID',
      client_secret: 'YOUR APP SECRET',
      callback_url: '{API URL}/user/callback/facebook',
    },
    google: {
      client_id: 'YOUR APP ID',
      client_secret: 'YOUR APP SECRET',
      callback_url: '{API URL}/user/callback/google',
    },
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
    facebook: {
      client_id: 'YOUR APP ID',
      client_secret: 'YOUR APP SECRET',
      callback_url: '{API URL}/user/callback/facebook',
    },
    google: {
      client_id: 'YOUR APP ID',
      client_secret: 'YOUR APP SECRET',
      callback_url: '{API URL}/user/callback/google',
    },
  },
};
const env = process.env.NODE_ENV || 'development';
module.exports = config[env];
