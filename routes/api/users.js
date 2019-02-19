/* eslint-disable no-console */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const keys = require('../../config/keys');
const axios = require('axios');

const router = express.Router();

// Load User model
const User = require('../../models/User');

// Load validation
const validateRegistrationInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

router.get('/test', (req, res) => {
  res.json({ msg: 'Users works' });
});

// @route   POST api/users/register
// @desc    Register User
// @access  Public
router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegistrationInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      errors.email = 'Email already exists';
      return res.status(400).json(errors);
    } else {
      User.findOne({ handle: req.body.handle })
        .then(user => {
          if (user) {
            errors.handle = 'Handle already exists';
            return res.status(400).json(errors);
          }
          const newUser = new User({
            name: req.body.name,
            handle: req.body.handle,
            email: req.body.email,
            password: req.body.password,
            website: req.body.website,
            location: req.body.location,
            bio: req.body.bio,
            social: req.body.social
          });

          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              newUser
                .save()
                .then(usr => res.json(usr))
                .catch(error => console.log(error));
            });
          });

          axios
            .post('http://localhost:8000/send-welcome', {
              name: req.body.name,
              email: req.body.email
            })
            .then(res => console.log(res))
            .catch(err => console.log(err));
        })
        .catch(err => res.status(500).json(err));
    }
  });
});

// @route   POST api/users/login
// @desc    Login User / Return JWT Token
// @access  Public
router.post('/login', (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const { email } = req.body;
  const { password } = req.body;

  // Find user by email
  User.findOne({ email }).then(user => {
    // Check if found user
    if (!user) {
      errors.email = 'User not found';
      return res.status(400).json(errors);
    }

    //Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User matched, Create JWT payload
        const payload = {
          id: user.id,
          name: user.name,
          handle: user.handle
        };
        //Sign Token
        jwt.sign(
          payload,
          keys.secretOrKey,
          { expiresIn: 36000 },
          (err, token) => {
            res.json({
              success: true,
              token: `Bearer ${token}`
            });
          }
        );
      } else {
        errors.password = 'Password incorrect';
        return res.status(400).json(errors);
      }
    });
  });
});

// @route   GET api/users/current
// @desc    Return current user
// @access  Private
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    User.findOne({ handle: req.user.handle })
      .then(user => {
        if (!user) {
          errors.nouser = 'There is no user for that handle';
          return res.status(404).json(errors);
        }
        res.json(user);
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   GET api/users/handle/:handle
// @desc    Return user by handle
// @access  Public
router.get('/handle/:handle', (req, res) => {
  const errors = {};
  User.findOne({ handle: req.params.handle })
    .then(user => {
      if (!user) {
        errors.noprofile = 'There is no profile for this user';
        res.status(404).json(errors);
      }
      res.json(user);
    })
    .catch(err => res.status(500).json(err));
});

module.exports = router;
