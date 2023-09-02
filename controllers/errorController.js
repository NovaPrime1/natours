const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}:${err.value}.`;
  // console.log('Inside the handleCastErrorDB');
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again', 401);

const handleDuplicateFieldDB = err => {
  // console.log('Inside of the handler for duplicate fields');
  // const value = err.message.match(/(["'])(\\?.)*?\1/)[0]; -- In a different field.
  // console.log(err.keyValue.name);
  const value = err.keyValue.name;
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationDB = err => {
  // This is going to loop through the elements in the array of items
  // console.log('Inside of the handler for fields validation');
  const errors = Object.values(err.errors).map(el => el.message);
  // console.log('Inside of the handler for fields validation after loop');

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // RENDERED WEBSITES
    // console.error('ERROR *', err);
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    //Operational error we trust and can send to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    //Programming or other error: don't want to leak error or details to client
    //1) log error
    // console.error('ERROR *', err); // why logging error twice

    //2) Send generated message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }

  // B) RENDERED WEBSITES
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: `${err.message}`
    });
  }

  // B) Programming or other unknow error: don't leak error details
  // 1) Log error
  // console.error('ERROR *', err);

  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    // does not copy the message because spead operator are not supported. Do something diff
    error.message = err.message;

    // console.log(' Inside the prod switch for castError');
    if (err.name === 'CastError') error = handleCastErrorDB(error);

    // console.log(err.code);
    if (err.code === 11000) error = handleDuplicateFieldDB(error);
    // if (error) error = handleCastErrorDB(error);
    // console.log(err);
    // console.log(err.name);
    if (err.name === 'ValidationError') error = handleValidationDB(error);
    // console.log('This is to check validation error');
    // console.log(err.name);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
