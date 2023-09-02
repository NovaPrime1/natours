const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

//name, emaol, phone, password, password confirm.

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name']
    // unique: true,
    // trim: true,
    // maxlength: [40, 'A tour must have greater or equal to 40 charaters'],
    // minlength: [10, 'A tour must have less  or equal to 10 charaters']
    // validate: [validator.isAlpha, 'Tour name must only contain charaters'] -- external lib for validator
  },
  email: {
    type: String,
    required: [true, 'Please enter your email address'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin']
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
    select: false
    // This type is only for strings
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm you password'],
    validate: {
      validator: function(el) {
        // this keyword is only going to work on SAVE or CREATE
        return el === this.password; // abc === abc
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// use the async as the to block the event loop.
userSchema.pre('save', async function(next) {
  // Only run this function of password was modified.
  if (!this.isModified('password')) return next();

  // popular hashing password bcryt package
  // 12 is the amount of cost the salt/hash
  // use await before you call the async function.
  this.password = await bcrypt.hash(this.password, 12);

  // Do not want to persist to dbase
  // Delete the passwordConfirm field.
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // subtract (1,000 milseconds) 1 second to make token is created after password has been changed (race condition)
  next();
});

// This will be used for all queries that start with find
userSchema.pre(/^find/, function(next) {
  // this point to the current query
  // show all user not equal to false which is different from active = false
  this.find({ active: { $ne: false } });
  next();
});

// Instance method
userSchema.methods.correctPassword = async function(
  canidatePassword,
  userPassword
) {
  // this.password is not avaiulable because it is select : false
  return await bcrypt.compare(canidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    // console.log(this.passwordChangedAt, JWTTimestamp);
    return JWTTimestamp < changedTimestamp; // 100 < 200
  }
  //False means not changed
  return false;
};

//Instance method to generate a random reset token

userSchema.methods.createPasswordResetToken = function() {
  // Never store this in a database in plan text. So has to be encrypted
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Log as object so your can see the var name with value
  // also note you can't log an object with the this. keyword
  //console.log({ resetToken }, this.passwordResetToken);
  // We need time in milseconds so = Data.now() + 10 minutes * 60 for seconds * 1000 for miliseconds
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // console.log(
  //   ' This password expires at this time:' + this.passwordResetExpires
  // );

  return resetToken;
};

// Create the model out of the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
