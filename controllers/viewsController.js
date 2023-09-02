const Tour = require('../models/tourModel');
//const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');

exports.getOverview = catchAsync(async (req, res, next) => {
  //1) Get tour data from collection

  const tours = await Tour.find();

  //2) Build template

  //3) Render the template using tour data from step 1

  res.status(200).render('overview', {
    title: 'All Tours',
    // Passing in the model tours: tour -- pulled from database
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data, for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  // If this is commented out then the entire error is leaked to the client.
  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  //2) Build template
  // 3) Render template using the data from 1)
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('tour', {
      title: `${tour.name} Tour `,
      tour
    });
});

// Here we are creating the corresponding method for the route to perform the render of HTL page
exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1) Find all bookings -- Looking to do a virtual populated ( contain all the booking doc - only IDs)
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map(el => el.tour);
  // New operator -- It will find all tour that is in the tour ID array. This will capture the tours from the array of IDs
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  // Use the overview page to rending the selected tours.
  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});

// Never update password by findById and update. Because it is not going to run the safe middle that is going to take care of encrypting the password.
// Normallly a separate form for updating password.
exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser
  });
});
