const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const User = require('../models').user;

const { Op } = Sequelize;

module.exports = (passport) => {
  passport.use(new LocalStrategy(
    ((username, password, done) => {
      User.findOne({
        where: {
          [Op.or]: [{ username }, { email: username }],
        },
      }).then(async (user) => {
        if (!user) { return done(null, false); }
        if (!(await bcrypt.compare(password, user.password))) { return done(null, false); }
        return done(null, user);
      }).catch((error) => {
        done(error);
      });
    }),
  ));
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
      done(null, user);
    }).catch((error) => {
      done(error, null);
    });
  });
};
