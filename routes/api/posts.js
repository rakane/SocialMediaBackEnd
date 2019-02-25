/* eslint-disable no-console */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const keys = require('../../config/keys');
const cloudinary = require('cloudinary');
const formData = require('express-form-data');

const router = express.Router();

//Cloudinary Config
cloudinary.config({
  cloud_name: keys.cloudname,
  api_key: keys.CloudinaryAPI,
  api_secret: keys.CloudinaryAPISecret
});

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

    let uploadFile;
    let fileName;

    if (req.files !== undefined) {
      uploadFile = req.files.file;
      fileName = req.files.file.name;

      cloudinary.v2.uploader.upload(
        uploadFile.path,
        {
          public_id: `posts/${fileName}`,
          resource_type: 'auto',
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

    const newPost = new Post({
      text: req.body.text,
      media: fileName,
      user: {
        name: req.user.name,
        handle: req.user.handle
      }
    });

    newPost
      .save()
      .then(post => res.json(post))
      .catch(err => console.log(err));
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

// @route   DELETE api/posts/:id
// @desc    Delete post
// @access  Private
router.delete(
  '/:handle/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    User.findOne({ handle: req.user.handle }).then(user => {
      Post.findById(req.params.id)
        .then(post => {
          // Check for post owner
          if (post.handle.toString() !== req.user.handle) {
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
    User.findOne({ handle: req.user.handle }).then(user => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(
              like => like.handle.toString() === req.user.handle
            ).length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: 'User already liked this post' });
          }

          post.likes.unshift({ handle: req.user.handle, name: req.user.name });
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
    User.findOne({ handle: req.user.handle }).then(user => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(
              like => like.handle.toString() === req.user.handle
            ).length === 0
          ) {
            return res
              .status(400)
              .json({ notliked: "You haven't liked this post" });
          }

          const removeIndex = post.likes
            .map(item => item.handle.toString())
            .indexOf(req.user.handle);

          post.likes.splice(removeIndex);

          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
    });
  }
);

// @route   POST api/posts/comment/:id
// @desc    Comment on post
// @access  Private
router.post(
  '/comment/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.user.name,
          handle: req.user.handle
        };

        // Add to comments array
        post.comments.unshift(newComment);

        // Save
        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
  }
);

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete comment from post
// @access  Private
router.delete(
  '/comment/:id/:comment_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexists: 'Comment does not exist' });
        }

        // Get remove index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        // Splice comment out of array
        post.comments.splice(removeIndex, 1);

        post.save().then(post => res.json(post));
      })
      .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
  }
);

// @route   GET api/posts/:handle/posts
// @desc    Get all posts of a user
// @access  Public
router.get('/:handle/posts', (req, res) => {
  Post.find({ 'user.handle': req.params.handle })
    .then(posts => res.json(posts))
    .catch(err => res.status(400).json(err));
});

module.exports = router;
