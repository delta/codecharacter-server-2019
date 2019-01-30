const express = require('express');
// const { Op } = require('sequelize');
const Leaderboard = require('../models').leaderboard;
const User = require('../models').user;

Leaderboard.belongsTo(User, { foreignKey: 'user_id' });
const router = express.Router();
// let filtered;
let index;
// eslint-disable-next-line prefer-const
let obj = {};
router.post('/:start/:finish', async (req, res) => {
  let { finish } = req.params;
  const { start } = req.params;
  const leaderboard = await Leaderboard.findAll(
    {
      include: [
        {
          model: User,
          attributes: ['fullName', 'country'],
        },
      ],
      order: ['rating'],
      attributes: ['rating'],
    },
  );
  if (leaderboard.length) {
    for (index = 0; index < leaderboard.length; index += 1) {
      if (index >= start && index < finish) {
        obj[index - start] = {};
        obj[index - start].rank = index + 1;
        obj[index - start].rating = leaderboard[index].rating;
        obj[index - start].fullName = leaderboard[index].user.fullName;
        obj[index - start].country = leaderboard[index].user.country;
      }
    }
    if (leaderboard.length < finish + 1) {
      finish = leaderboard.length;
    } else if (start > leaderboard.length) {
      return res.status(200).send({ type: 'Success', error: '', message: JSON.parse('') });
    }
    // console.log(leaderboard.text());
    // filtered = obj.slice(start, finish + 1);
    return res.status(200).send({ type: 'Success', error: '', message: JSON.stringify(obj) });
  }
  return res.status(400).json({
    message: 'Error',
    error: 'No Entries Found',
  });
});
module.exports = router;
