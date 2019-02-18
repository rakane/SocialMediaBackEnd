const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validatePostInput(data) {
  let errors = {};

  data.text = !isEmpty(data.text) ? data.text : '';

  // Checks if text is between 1 and 140 characters
  if (!Validator.isLength(data.text, { min: 1, max: 140 })) {
    errors.text = 'Post must be between 1 and 140 characters';
  }

  // Checks if text is empty
  if (Validator.isEmpty(data.text)) {
    errors.text = 'Text field is required';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
