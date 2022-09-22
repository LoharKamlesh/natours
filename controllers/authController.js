//crypto package to encrypt data
const crypto = require('crypto');
//import jsonwebtoken to authenticate user
const jwt = require('jsonwebtoken');
//requiring inbuilt utilities
const { promisify } = require('util');
//importing user model
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  //console.log(id);
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  //console.log(newUser._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };

  // if (process.env.NODE_ENV === 'production') {
  //   cookieOptions.secure = true;
  // }
  // if (req.secure || req.headers['x-forwarded-proto']==='https') {
  //   cookieOptions.secure = true;
  // }
  res.cookie('jwt', token, cookieOptions);

  //Remove password from output
  user.password = undefined;

  //Sending new user to client
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
//creating export for controller
exports.signup = async (req, res, next) => {
  try {
    //creating new user, and new document using model
    //const newUser = await User.create(req.body); //pass an object with the data form which the user should be created.

    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
      passwordResetToken: req.body.passwordResetToken,
      passwordResetExpires: req.body.passwordResetExpires,
      // active: req.body.active,
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
    //console.log(url);
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, req, res);

    // const token = signToken(newUser._id);
    // //console.log(newUser._id);
    // const cookieOptions = {
    //   expires: new Date(
    //     Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    //   ),
    //   secure: true,
    //   httpOnly: true,
    // };
    // res.cookie('jwt', token, cookieOptions);

    // if (process.env.NODE_ENV === 'production') {
    //   cookieOptions.secure = true;
    // }

    // //Sending new user to client
    // res.status(201).json({
    //   status: 'success',
    //   token,
    //   data: {
    //     user: newUser,
    //   },
    // });

    next();
  } catch (err) {
    //return next(new AppError(`${err}`, 400));
    res.status(400).json({
      status: 'fail',
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //next();
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    //1)check if the email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }
    //2)check if the user exists && password is correct
    const user = await User.findOne({ email }).select('+password'); //field:variable
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401)); //401, unauthorised
    }

    //console.log(user);

    //3) If everything is ok, send JSONwebtoken to client

    createSendToken(user, 201, req, res);

    // const token = signToken(user._id);
    // const cookieOptions = {
    //   expires: new Date(
    //     Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    //   ),
    //   secure: true,
    //   httpOnly: true,
    // };
    // res.cookie('jwt', token, cookieOptions);

    // if (process.env.NODE_ENV === 'production') {
    //   cookieOptions.secure = true;
    // }
    // res.status(200).json({
    //   status: 'success',
    //   token,
    // });
  } catch (err) {
    //return next(new AppError(`${err}`, 400));
    res.status(400).json({
      status: 'fail',
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    //1)getting token and checkif it exist
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    //console.log(token);
    if (!token) {
      return next(
        new AppError('You are not logged in! Please login to get access.', 401)
      );
    }

    //2)verification token

    // const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //console.log(decoded);

    //3)check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exist', 401)
      );
    }

    //4)check if user change password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          'User recently changed password. Please log in again.',
          401
        )
      );
    }
    //Grant access to protected route
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (err) {
    return next(new AppError(`${err}`, 400));
    // res.status(400).json({
    //   status: 'fail',
    //   error: err,
    //   message: err.message,
    //   stack: err.stack,
    // });
  }
};

//only for e=rendered pages and there will be no error
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      //2)check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //3)check if user change password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError());
      }
      //There is a looged in user
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
};

//we caqnt pass parameter to middlewafre function so we create a wrapper function and then return a middleware function
exports.restrictTo =
  (...roles) =>
  //console.log(roles);
  (req, res, next) => {
    //roles is an array['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403) //403  forbidded
      );
    }
    next();
  };

exports.forgotPassword = async (req, res, next) => {
  //1)Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user with that email address', 404));
  }

  //2)generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //will disable all the validations and save the document

  // const message = `Forgot your password? Submit a PATCH request with your new password and passwordconfirm to: ${resetURL}\n If you din't forgot your password, please ignore this email!`;
  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for only 10 min)',
    //   message,
    // });
    //3)Send it back as an email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending an email. Try again later!', 500)
    );
  }
};
exports.resetPassword = async (req, res, next) => {
  try {
    //1) Get user based on token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    //2) If token has not expired, and there is user, set the new password
    if (!user) {
      return next(new AppError('Token is invalid or has Expired', 400)); //400, bad request
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save(); //dont turn off validator bcoz now we want to validate

    //3) Update changedPasswordAt property for the user
    //4) Log the user in, send JWT
    createSendToken(user, 201, req, res);
    // const token = signToken(user._id);
    // const cookieOptions = {
    //   expires: new Date(
    //     Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    //   ),
    //   secure: true,
    //   httpOnly: true,
    // };
    // res.cookie('jwt', token, cookieOptions);

    // if (process.env.NODE_ENV === 'production') {
    //   cookieOptions.secure = true;
    // }
    // res.status(200).json({
    //   status: 'success',
    //   token,
    // });
    //next();
  } catch (err) {
    return next(new AppError(`${err}`, 400));
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    //1) Get the user form the collection
    const user = await User.findById(req.user.id).select('+password');

    //2)Check if the POSTed  current password is correct
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError('Your current password is wrong', 401));
    }

    //3)If password is correct, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();

    //4)log user in, send JWT
    createSendToken(user, 201, req, res);
    // const token = signToken(user._id);
    // const cookieOptions = {
    //   expires: new Date(
    //     Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    //   ),
    //   secure: true,
    //   httpOnly: true,
    // };
    // res.cookie('jwt', token, cookieOptions);

    // if (process.env.NODE_ENV === 'production') {
    //   cookieOptions.secure = true;
    // }
    // res.status(200).json({
    //   status: 'success',
    //   token,
    //   data: {
    //     user: user,
    //   },
    // });
  } catch (err) {
    return next(new AppError(`${err}`, 400));
  }
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};
