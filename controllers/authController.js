const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookiesOptions = {
    //convert to miliseconds
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // to prevent xss attacks only http
    httpOnly: true
  };

  // only sent on secure options - https: For Prod
  if (process.env.NODE_ENV === 'production') cookiesOptions.secure = true;

  // reference the above
  res.cookie('jwt', token, cookiesOptions);

  // remove the encrypted password from output.
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // Security vulnerability because user can set themselves up as admin
  // const newUser = await User.create(req.body);

  // Specify fields
  const newUser = await User.create(req.body);
  const url = `http://localhost:3000/me`;
  // const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // console.log(' We are in the login module in the authController');

  //1) check email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!, 400'));
  }

  //2) Check if the user exist and if password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email for password', 401));
  }

  // console.log(user);

  //3) if everything is ok send the token back to the client

  createSendToken(user, 200, res);
});

exports.logout = (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get the token to see if exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  // console.log(token);

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token ( promisify a function)  | try catch but use our error controller
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 3) Check if the user still exists- No one change the webtoken
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError('The user no long exists!', 401));
  }

  // 4) Check if user change passwords after the token was issued/ iat = issued at
  //currentUser.changedPasswordAfter(decoded.iat)
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );
  }
  // GRANT ACCESS to protected route.
  // put on res.local so we can use it on all our templates.
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages and there will be no error.
// For rendered pages we will not have the token in the header, we will only use the cookie
// Remember the authorization header is only for the api.
exports.isLoggedIn = async (req, res, next) => {
  // console.log('Inside the isLoggedIn method');
  if (req.cookies.jwt) {
    try {
      // Verify tokent
      // console.log(' Inside the if state to check for jwt cookie');
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if the user still exists- No one change the webtoken
      // console.log(' Checking for current user');
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        // console.log(' Inside the !currentUser if statement');
        return next();
      }

      // 4) Check if user change passwords after the token was issued/ iat = issued at
      //currentUser.changedPasswordAfter(decoded.iat)
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // THERE IS A LOGGED IN USER
      // this will allow pug to use this variable inside a template  |res.locals.user mean "user" can be used in template.
      // req.user = currentUser; - put the current user on response.locals
      // Two next() are used so the next middleware can be called in both cases.
      // console.log(
      //   ' Directly before we expose the user var to the pug templates'
      // );
      res.locals.user = currentUser;
      // console.log(
      //   ' Directly after we expose the user var to the pug templates'
      // );
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// Can't pass arug into middleware functions. Create a wrapper function that returns middleware
// Use the rest agrument syntax
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array ['admin','lead-guide'].roles='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this operation',
          403
        )
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on posted email

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();

  // turns off the validator before you save
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    // console.log('We are at the following message : ' + message);
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });

    // console.log(
    //   'Passed the res status and next statement is the catch for err'
    // );
    // Not enough to catch the error but we need to reset the token
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was a error sending the email. Try agin later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token. Need to encrypt then compare.
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex'); // parms specified in url

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  //2) if token has not expired, and there is user set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // do not need to turn off the validators

  //3) Update changedPasswordAt property for the user

  //4) Log the user in send JWT

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection - requirements. This should be done based on user._id always primary key

  //Check to make sure the request has all necessary information first.
  // if (
  //   // !req.body.email ||
  //   !req.body.passwordCurrent ||
  //   !req.body.password ||
  //   !req.body.passwordConfirm
  // ) {
  //   return next(
  //     new AppError(
  //       'Please provide current password, new password and password confirmation !',
  //       400
  //     )
  //   );
  // }
  // const email = req.body.email;
  // const { email } = req.body;

  //Check if email and password is in database and assign it to a user
  const user = await User.findById(req.user.id).select('+password');

  //const user = await User.findById(req.user.id).select('+password'); -- Jonas way..
  // console.log(user);

  // 2) Check if POSTed password is correct - requirements
  // console.log('This is the first:' + req.body.password);
  // console.log('This is the user object password:' + user.password);
  // console.log('Right before the if statement checking email and passwords');

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // Please note you are not checking against the token so no decription is needed.

  // 3) If password is correct then update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // Can use FindByIdAndUpdate will not work as intended -
  // because this keyword does work because moongoose does not keep password in memory

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

// Create a reset token

// Send token with new password to update
