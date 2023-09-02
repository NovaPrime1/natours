const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
// eslint-disable-next-line import/no-extraneous-dependencies
const cookieParser = require('cookie-parser');

// Here you are mouting the routes to the components. See below in Routes
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// For the pug template Engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) Global MIDDLEWARES - Executed in the order of the code
//Serving static files
// app.use(express.static(`${__dirname}/public`));
// using the path const for better packaging
// this why all the styles and images works - defined in express applications
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
// app.use(helmet());

// app.use(helmet({ ContentSecurityPolicy: false }));

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// app.use(
//   helmet.contentSecurityPolicy({
//     useDefaults: true,
//     directives: {
//       'font-src': ["'self'", 'external-website.com'],
//       // allowing styles from any website
//       'script-src': [
//         'https://connect-js.stripe.com',
//         'https://js.stripe.com/v3/'
//       ],
//       'frame-src': [
//         'https://connect-js.stripe.com',
//         'https://js.stripe.com/v3/'
//       ]
//     }
//   })
// );

//Development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit the request from the same IP : Specificed API see below
const limiter = rateLimit({
  // Allow 100 ip request to the same Ip in one hour; tosses error message
  max: 50,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
//Note limited is reset once app is restarted.
app.use('/api', limiter);

//Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// This middle will help parse data from a url encoded form.
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parses data from the cookie
app.use(cookieParser());

// Data Sanitization against NoSql query injection - Important
//protect against SQL injections by looking at body, query and perms and filter out $ and .
app.use(mongoSanitize());

//Data sanitization against _XSS
//Clean any input from malicious HTML - Converting all html symbols
app.use(xss());

//Prevent parameter pollution
//Used to clear up the parameter strings.
//If word is given multiple time it creates an arrary that can't be split.
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// app.use((req, res, next) => {
//   console.log('Hello from the middleware 👋');
//   next();
// });

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 3) ROUTES - Middleware that is mount on this path.
// anytime that is a url that has this path it will point to the router

// go to views folder and look for the template name base and render it.
// app.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'The Forest Hiker',
//     user: 'Corey'
//   });
// });

// app.get('/overview', (req, res) => {
//   res.status(200).render('overview', {
//     title: 'All Tours'
//   });
// });

// app.get('/tour', (req, res) => {
//   res.status(200).render('tour', {
//     title: 'The Forst Hiker Tour'
//   });
// });

//  Note -- '/' will go directly in to view router
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//Handle all URL - If we are able to reach this point then it is assumed bad
app.all('*', (req, res, next) => {
  // Global handling Middleware -before Error Handling Class
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
