const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  //console.log(err);
  const value = err.match(/(?<=(["']))(?:(?=(\\?))\2.)*?(?=\1)/);
  //console.log(value);
  const message = `Invalid value ${value[0]}`;

  return new AppError(message, 400);
};

const handleMongoServerErrorDB = (err) => {
  //console.log(err);
  const value = err.match(/(?<=(["']))(?:(?=(\\?))\2.)*?(?=\1)/);
  //console.log(value);
  const message = `Duplicate field value. ${value[0]}. Please use another name`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  //console.log(err);
  const value = err.split(':').slice(3, 7).join(',').substring(0, 151);
  //console.log('💥', value);
  const message = `Validation Error. ${value}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  //console.log(err);
  const message = `Invalid Token Error`;
  return new AppError(message, 401);
};

const handleTokenExpiredError = () => {
  const message = `Your token has expired. Please log in again`;
  return new AppError(message, 401);
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    //console.log('Dev error', err);
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      //console.log('Prod error', err);
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      //Programming or other unknown error: don't leak error details
    } else {
      //1) log error
      console.error('Error💥', err);

      //2)Send generic message to client
      return res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
      });
    }
  } else {
    if (err.isOperational) {
      //console.log('Prod error', err);
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message,
      });
      //Programming or other unknown error: don't leak error details
    } else {
      //1) log error
      console.error('Error💥', err);

      //2)Send generic message to client
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later',
      });
    }
  }
  //Operational, trusted error:send to client
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  //err.message = err.message || 'something went wrong! Please try again later';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    console.log(err.stack);
    if (err.stack.includes('CastError')) {
      error = handleCastErrorDB(err.stack);
    }
    if (err.stack.includes('MongoServerError')) {
      error = handleMongoServerErrorDB(err.stack);
    }
    if (err.stack.includes('ValidationError')) {
      error = handleValidationErrorDB(err.stack);
    }
    if (err.stack.includes('JsonWebTokenError')) {
      error = handleJWTError();
    }
    if (err.stack.includes('TokenExpiredError')) {
      error = handleTokenExpiredError();
    }

    sendErrorProd(error, req, res);
  }
};
