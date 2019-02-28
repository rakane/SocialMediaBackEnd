/* eslint-disable no-console */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const keys = require('../../config/keys');
const axios = require('axios');
const cloudinary = require('cloudinary');
const formData = require('express-form-data');

const router = express.Router();

router.use(formData.parse());

//Cloudinary Config
cloudinary.config({
  cloud_name: keys.cloudname,
  api_key: keys.CloudinaryAPI,
  api_secret: keys.CloudinaryAPISecret
});

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
      User.findOne({ handle: req.body.handle }).then(user => {
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
          youtube: req.body.youtube,
          twitter: req.body.twitter,
          facebook: req.body.facebook,
          linkedin: req.body.linkedin,
          instagram: req.body.instagram
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
        /*
        axios
          .post('http://localhost:8000/send-welcome', {
            name: req.body.name,
            email: req.body.email
          })
          .then(res => console.log(res))
          .catch(err => console.log(err));
          */
      });
    }
  });
});

// @route   POST api/users/upload-image
// @desc    Upload profile image to cloudinary
// @access  Public
router.post('/upload-image', (req, res) => {
  let uploadFile = req.files.file;
  let fileName = req.files.file.name;

  if (uploadFile !== undefined) {
    cloudinary.v2.uploader.upload(
      uploadFile.path,
      {
        width: 200,
        height: 200,
        crop: 'fit',
        public_id: `profile/${fileName}`,
        resource_type: 'image',
        overwrite: true
      },
      function(error, result) {
        if (error) {
          res.status(400).json({ uploaded: false });
        }
        res.json({ uploaded: true });
      }
    );
  }
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
        // Sign Token
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
  '/current',
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

// @route   POST api/users/update
// @desc    Update User profile
// @access  Private
router.post(
  '/update',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const profileFields = {};
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.twitter) profileFields.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.facebook = req.body.facebook;
    if (req.body.linkedin) profileFields.linkedin = req.body.linkedin;
    if (req.body.instagram) profileFields.instagram = req.body.instagram;

    User.findOne({ handle: req.user.handle }).then(user => {
      if (user) {
        // Update Profile
        User.findOneAndUpdate(
          { handle: req.user.handle },
          { $set: profileFields },
          { new: true }
        ).then(user => res.json(user));
      }
    });
  }
);

// @route   POST api/users/follow/
// @desc    Follow user
// @access  Private
router.post(
  '/follow',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    // Find Authenticated User
    User.findOne({ handle: req.user.handle })
      .then(authUser => {
        const newFollowing = {
          handle: req.body.handle,
          name: req.body.name
        };
        // Add to following
        authUser.following.unshift(newFollowing);
        // Save
        authUser.save().then(authUser => res.json(authUser));
      })
      .catch(err => res.status(400).json(err));

    //Find user to follow
    User.findOne({ handle: req.body.handle })
      .then(targetUser => {
        const newFollower = {
          handle: req.user.handle,
          name: req.user.name
        };
        // Add auth user to followers of target user
        targetUser.followers.unshift(newFollower);
        // Save
        targetUser.save().then(targetUser => console.log(targetUser));
      })
      .catch(err => res.status(400).json(err));
  }
);

// @route   POST api/users/unfollow
// @desc    Unfollow user
// @access  Private
router.post(
  '/unfollow',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    // Find Authenticated User
    User.findOne({ handle: req.user.handle })
      .then(authUser => {
        // Get remove index
        const removeIndex = authUser.following
          .map(user => user.handle.toString())
          .indexOf(req.body.handle);

        // Splice comment out of array
        authUser.following.splice(removeIndex, 1);

        authUser.save().then(user => res.json(user));
      })
      .catch(err => res.status(400).json(err));

    //Find target user
    User.findOne({ handle: req.body.handle })
      .then(targetUser => {
        // Get remove index
        const removeIndex = targetUser.followers
          .map(user => user.handle.toString())
          .indexOf(req.user.handle);

        // Splice comment out of array
        targetUser.followers.splice(removeIndex, 1);

        targetUser.save();
      })
      .catch(err => res.status(400).json(err));
  }
);

module.exports = router;
