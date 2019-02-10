const path = require('path');

const appPath = path.resolve('../');

module.exports = {
  up: queryInterface => queryInterface.bulkInsert('constants', [{
    key: 'MATCH_WAIT_TIME',
    value: 60000,
  }, {
    key: 'INITIAL_RATING',
    value: 1000,
  }, {
    key: 'DEFAULT_CODE_STORAGE_DIR',
    value: `${appPath}/storage/codes`,
  }, {
    key: 'DEFAULT_LEADERBOARD_STORAGE_DIR',
    value: `${appPath}/storage/leaderboard`,
  }, {
    key: 'DEFAULT_MAP_STORAGE_DIR',
    value: `${appPath}/storage/maps`,
  }, {
    key: 'DEFAULT_MATCH_LOG_STORAGE_DIR',
    value: `${appPath}/storage/matchLog`,
  }], {}),

  down: queryInterface => queryInterface.delete('constants', null, {}),
};
