/* eslint-disable no-console */
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const axios = require('axios');
const cors = require('cors');
const cloudinary = require('cloudinary');
const users = require('./routes/api/users');
const posts = require('./routes/api/posts');
const keys = require('./config/keys');

const app = express();

app.use(cors());

//Cloudinary Config
cloudinary.config({
  cloud_name: keys.cloudname,
  api_key: keys.CloudinaryAPI,
  api_secret: keys.CloudinaryAPISecret
});

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const db = keys.MongoURI;

// Connect to MongoDB
mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Passport middleware
app.use(passport.initialize());

// Passport Config
require('./config/passport')(passport);

// Use Routes
app.use('/api/users', users);
app.use('/api/posts', posts);
const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on ${port}...`));
