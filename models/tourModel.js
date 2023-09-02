/* eslint-disable no-console */
const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');
// const User = require('./userModel'); -- For Embedding

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour must have greater or equal to 40 charaters'],
      minlength: [10, 'A tour must have less  or equal to 10 charaters']
      // validate: [validator.isAlpha, 'Tour name must only contain charaters'] -- external lib for validator
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour  must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      // This type is only for strings
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      // setter function to remove the decimal percision
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this only points to current doc on new doc creations
          return val < this.price; // 100 < 200 = true
        },
        message: 'Discount price ({VALUE}) should be below the regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have an image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      // perm hide from the output.
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    // Creating a embedded document use an array
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    //guides: Array -- For Embedding
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Creating an index 1 asending  -1 desending order. Big performance gains
// tourSchema.index({ price: 1 });
// Compound index
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// This index need to 2d not 1 or -1
tourSchema.index({ startLocation: '2dsphere' });

// Can't use these in query. Technically not apart of the schema
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//Advanced feature virtual poperties
tourSchema.virtual('reviews', {
  // Ref name for collection
  ref: 'Review',
  // field of the foreign collection
  foreignField: 'tour',
  // field of the local collection to link the two models
  localField: '_id'
});

//Document middleware and it run before the .save() and .create() but not on insertMany or update
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// //Capture the new user documents/guides with these ids. This is an example of Embedding
// // Only for new document not updating data.
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   // Now we need to run all these promising in guidesPromises to put this.guides. Need to Promise.all to run them.
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', function(next) {
//   console.log('Will save document....');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE -- Prehook
// Using a regular expression to cover all commands that use find. ex - find, findOne, etc
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });

  next();
});

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });
// We could put an if condition here to ensure geoNear is first but it better to just comment the above
// middlware out

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
