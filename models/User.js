const mongoose = require('mongoose');

const { Schema } = mongoose;

// Create Schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  handle: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  website: {
    type: String
  },
  location: {
    type: String
  },
  bio: {
    type: String
  },
  youtube: {
    type: String
  },
  twitter: {
    type: String
  },
  facebook: {
    type: String
  },
  linkedin: {
    type: String
  },
  instagram: {
    type: String
  },
  followers: [
    {
      handle: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      }
    }
  ],
  following: [
    {
      handle: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      }
    }
  ]
});

module.exports = User = mongoose.model('users', UserSchema);
