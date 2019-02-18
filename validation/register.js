const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateRegistrationInput(data) {
  let errors = {};

  data.name = !isEmpty(data.name) ? data.name : '';
  data.handle = !isEmpty(data.handle) ? data.handle : '';
  data.email = !isEmpty(data.email) ? data.email : '';
  data.password = !isEmpty(data.password) ? data.password : '';
  data.password2 = !isEmpty(data.password2) ? data.password2 : '';
  data.website = !isEmpty(data.website) ? data.website : '';
  data.location = !isEmpty(data.location) ? data.location : '';
  data.bio = !isEmpty(data.bio) ? data.bio : '';
  // data.social = !isEmpty(data.social) ? data.social : {};

  // Checks length of name
  if (!Validator.isLength(data.name, { min: 2, max: 30 })) {
    errors.name = 'Name must be between 2 and 30 characters';
  }
  // Checks if name is empty
  if (Validator.isEmpty(data.name)) {
    errors.name = 'Name field is required';
  }
  // Checks length of handle
  if (!Validator.isLength(data.handle, { min: 1, max: 30 })) {
    errors.handle = 'Handle must be between 1 and 30 characters';
  }
  // Checks if handle is empty
  if (Validator.isEmpty(data.handle)) {
    errors.handle = 'Handle field is required';
  }
  // Checks if email is empty
  if (Validator.isEmpty(data.email)) {
    errors.email = 'Email field is required';
  }
  // Checks if email is valid
  if (!Validator.isEmail(data.email)) {
    errors.email = 'Email is invalid';
  }
  // Checks if password is empty
  if (Validator.isEmpty(data.password)) {
    errors.password = 'Password field is required';
  }
  // Checks length of password
  if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
    errors.password = 'Password must be at 6 least characters';
  }
  // Checks if confirm password is empty
  if (Validator.isEmpty(data.password2)) {
    errors.password2 = 'Confirm password field is required';
  }
  // Checks if password and confirm password are equal
  if (!Validator.equals(data.password, data.password2)) {
    errors.password2 = 'Passwords must match';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
