const Review = require('../models/reviewModel');
//const catchAsync = require('../utils/catchAsync');
//const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// This is a new middleware that is called on the routes.
exports.setTourUserIds = (req, res, next) => {
  // Allow for nested routes - define them when not specificed in requst body.
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id; // req.user.id from protect middleware
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
