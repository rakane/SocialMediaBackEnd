const mongoose = require('mongoose');

const { Schema } = mongoose;

// Create Schema
const PostSchema = new Schema({
  handle: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  likes: [
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
  comments: [
    {
      handle: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      text: {
        type: String,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Post = mongoose.model('post', PostSchema);
