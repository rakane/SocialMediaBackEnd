/* eslint-disable no-console */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const keys = require('../../config/keys');

const router = express.Router();

const validatePostInput = require('../../validation/post');

const Post = require('../../models/Post');
const User = require('../../models/User');

// @route   POST api/users/create-post
// @desc    Create post
// @access  Private
router.post(
  '/create-post',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      handle: req.body.handle,
      name: req.body.name,
      text: req.body.text
    });

    newPost.save().then(post => res.json(post));
  }
);

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Public
router.get('/:id', (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err =>
      res.status(404).json({ nopostfound: 'No post found with that id' })
    );
});

// @route   DELETE api/posts/:handle/:id
// @desc    Delete post
// @access  Private
router.delete(
  '/:handle/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    User.findOne({ handle: req.params.handle }).then(user => {
      Post.findById(req.params.id)
        .then(post => {
          // Check for post owner
          if (post.handle.toString() !== req.params.handle) {
            return res
              .status(401)
              .json({ notauthorized: 'User not authorized' });
          }
          // Delete
          post.remove().then(() => res.json({ success: true }));
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
    });
  }
);

// @route   POST api/posts/like/:id
// @desc    Like post
// @access  Private
router.post(
  '/like/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    User.findOne({ handle: req.body.handle }).then(user => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(
              like => like.handle.toString() === req.body.handle
            ).length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: 'User already liked this post' });
          }

          post.likes.unshift({ handle: req.body.handle, name: req.body.name });
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
    });
  }
);

// @route   POST api/posts/unlike/:id
// @desc    Unlike post
// @access  Private
router.post(
  '/unlike/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    User.findOne({ handle: req.body.handle }).then(user => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(
              like => like.handle.toString() === req.body.handle
            ).length === 0
          ) {
            return res
              .status(400)
              .json({ notliked: "You haven't liked this post" });
          }

          const removeIndex = post.likes
            .map(item => item.handle.toString())
            .indexOf(req.body.handle);

          post.likes.splice(removeIndex);

          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
    });
  }
);

module.exports = router;
