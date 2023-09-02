/* eslint-disable no-console */
/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');
const Tour = require('./tourModel');
//const validator = require('validator');

// review, rating, createAt / reference to the tours that this belongs, ref to user

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty']
      // trim: true,
      // maxlength: [256, 'A review must have greater or equal to 40 charaters'],
      // minlength: [40, 'A review must have less  or equal to 10 charaters']
      // validate: [validator.isAlpha, 'Tour name must only contain charaters'] -- external lib for validator
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
      //validate: [validator.isEmail, 'Please provide a valid email']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    //tourID for ref the tour table
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    //tourID for ref the tour table
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must have a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//  This compund index will ensure that each user can only make one review
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Function to populate the review with ref info from tour and the user from the above model collection. See -line29
// Please note the tour and user is chained together with two populate statements.
// Essentially this is a pre define hook that looks at the any find call and populates the tour and use in the query.
// Please note this will allow time because of the extra queries (user, tour query)
reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  //   // Chained the user on this function as well.
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  // We commented out about because we don't need the tour on every review. It is duplicative
  // We just need the user
  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  // Use the key word this to access the model directly not an instance
  //console.log(tourId);
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  //console.log(stats);

  if (stats.length > 0) {
    // Returns a promise but we need to update it so we don't store it anywhere.
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      // default when there are no reviews at all
      ratingsAverage: 4.5
    });
  }
};

// Note this pre save middleware is call before the below model is created and would not contain this middleware
// So we need to use the this key with a constructor function to fix that problem.
reviewSchema.post('save', function(next) {
  // this points to current review model.  The contructor is the model which created this particular doc.
  this.constructor.calcAverageRatings(this.tour);
});

// We can also use query middleware for hook-- findByIdAndUpdate. But we need access to document not just results.
// So we are going to implement pre middleware for these events..- Hooks
reviewSchema.pre(/^findOneAnd/, async function(next) {
  //this key is for the current document
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  //await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

// Create the model out of the schema
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
