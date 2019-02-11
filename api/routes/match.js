const express = require('express');
// const { check, validationResult } = require('express-validator/check');
// const { handleValidationErrors } = require('../utils/validation');

const Match = require('../models').match;
const User = require('../models').user;

const router = express.Router();
const parsify = obj => JSON.parse(JSON.stringify(obj));
router.get('/all', async (req, res) => {
  let matches = await Match.findAll();
  if (matches.length === 0) {
    return res.status(200).json({ type: 'Success', error: '', matchData: '' });
  }
  let userId1Results = [];
  for (let i = 0; i < matches.length; i += 1) {
    const user = User.findOne({
      where: {
        id: JSON.parse(JSON.stringify(matches))[i].userId1,
      },
    });
    userId1Results.push(user);
  }
  await Promise.all(userId1Results);
  let userId2Results = [];
  for (let index = 0; index < matches.length; index += 1) {
    const user = User.findOne({
      where: {
        id: matches[index].userId2,
      },
    });
    userId2Results.push(user);
  }
  await Promise.all(userId2Results);
  matches = parsify(matches);
  userId1Results = parsify(userId1Results);
  userId2Results = parsify(userId2Results);
  for (let i = 0; i < matches.length; i += 1) {
    matches[i] = { ...matches[i], username1: userId1Results[i].fulfillmentValue.username };
    matches[i] = { ...matches[i], username2: userId2Results[i].fulfillmentValue.username };
    delete matches[i].updatedAt;
    delete matches[i].status;
  }
  return res.status(200).json({ type: 'Success', error: '', matchData: parsify(matches) });
});

module.exports = router;
