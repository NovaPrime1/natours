const moongoose = require('mongoose');

const bookingSchema = new moongoose.Schema({
  tour: {
    type: moongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!']
  },
  user: {
    type: moongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User!']
  },
  price: {
    type: Number,
    require: [true, 'Booking must belong to a price!']
  },
  createdAt: {
    type: Date,
    detault: Date.now()
  },
  paid: {
    type: Boolean,
    default: true
  }
});

// For the pre find middleware we always have to call next otherwise the program will get stuck.
bookingSchema.pre(/^find/, function(next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name'
  });
  next();
});

const Booking = moongoose.model('Booking', bookingSchema);

module.exports = Booking;
