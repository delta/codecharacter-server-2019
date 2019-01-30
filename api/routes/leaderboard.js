const express = require('express');
// const { Op } = require('sequelize');
const Leaderboard = require('../models').leaderboard;
const User = require('../models').user;

Leaderboard.belongsTo(User, { foreignKey: 'user_id' });
const router = express.Router();
let filtered;
router.post('/:start/:finish', async (req, res) => {
  let { finish } = req.params;
  const { start } = req.params;
  const leaderboard = await Leaderboard.findAll(
    {
      include: [
        {
          model: User,
        },
      ],
      order: ['rating'],
    },
  );
  if (leaderboard.length) {
    if (leaderboard.length < finish + 1) {
      finish = leaderboard.length;
    } else if (start > leaderboard.length) {
      return res.status(200).send({ type: 'Success', error: '', message: JSON.parse('') });
    }
    filtered = leaderboard.slice(start, finish + 1);
    return res.status(200).send({ type: 'Success', error: '', message: JSON.parse(filtered) });
  }
  return res.status(400).json({
    message: 'Error',
    error: 'No Entries Found',
  });
});
module.exports = router;
