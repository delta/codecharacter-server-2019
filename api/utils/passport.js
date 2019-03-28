const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const rp = require('request-promise');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const codeStatus = require('../models').codestatus;
const git = require('../utils/gitHandlers');
const User = require('../models').user;
const config = require('../config/config.js');


const { Op } = Sequelize;

const registerSocial = (user, callback) => {
  User.findOne(
    { email: user.email },
  )
    .then((existingUser) => {
      if (existingUser) {
        return callback(null, existingUser, 'Success');
      }
      const passwordHash = bcrypt.hash(user.id, 10);
      return User.create({
        username: user.email,
        fullname: user.name,
        email: user.email,
        password: passwordHash,
        country: 'IN',
      })
        .then((createdUser) => {
          git.createUserDir(createdUser.username)
            .then(() => {
              codeStatus.create({
                userId: createdUser.id,
                latestSrcPath: `${git.getUserDir(createdUser.username)}/code.cpp`,
              });
            });
          return callback(null, createdUser, 'Success');
        })
        .catch(err => callback(err));
    })
    .catch(err => callback(err));
};

module.exports = (passport) => {
  passport.use(new LocalStrategy(
    ((email, password, done) => {
      User.findOne({
        where: {
          [Op.or]: [{ email }],
        },
      }).then(async (user) => {
        if (!user) {
          const options = {
            method: 'POST',
            uri: 'https://api.pragyan.org/19/event/login',
            body: {
              user_email: email,
              user_pass: password,
              event_id: config.event.event_id,
              event_secret: config.event.event_key,
            },
            json: true,
          };
          const response = await rp(options);
          const username = email.split('@')[0];
          if (response.status_code === 200) {
            const userCreated = await User.create({
              fullName: response.message.user_fullname,
              email,
              username,
              password: await bcrypt.hash(password, 10),
              country: 'IN',
              pragyanId: response.message.user_id,
              isPragyan: true,
              activated: true,
              type: 'Student',
              college: 'NIT Trichy',
            });
            if (await git.createUserDir(username)) {
              await codeStatus.create({
                userId: userCreated.id,
                latestSrcPath: `${git.getUserDir(username)}/code.cpp`,
              });
            }
            if (userCreated) {
              return done(null, userCreated, 'Success');
            }
            throw new Error('sequelize crashes during creation');
          } else if (response.status_code === 401) {
            // wrong password
            return done(null, false, 'Wrong Credentials!');
          } else {
            return done(null, false, 'Email not found');
          }
        } else if (!(await bcrypt.compare(password, user.password))) {
          return done(null, false, 'Wrong password');
        }
        return done(null, user, 'Success');
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
  passport.use(new FacebookStrategy(
    {
      clientID: config.facebook.client_id,
      clientSecret: config.facebook.client_secret,
      callbackURL: config.facebook.callback_url,
      profileFields: ['id', 'displayName', 'email'],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      const data = await JSON.stringify(profile);
      registerSocial(
        {
          id: data.id,
          name: data.name,
          email: data.email,
          country: data.location.country || 'IN',
        },
        done,
      );
    },
  ));
  passport.use(new GoogleStrategy(
    {
      clientID: config.google.client_id,
      clientSecret: config.google.client_secret,
      callbackURL: config.google.callback_url,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      const data = await JSON.stringify(profile);
      registerSocial(
        {
          id: data.id,
          name: data.name,
          email: data.email,
          country: data.country || 'IN',
        },
        done,
      );
    },
  ));
};
