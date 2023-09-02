/* eslint-disable */
const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.use(authController.protect);

// Create a Booking
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);
// //Updating a Booking
// .patch(bookingController.updateBooking)
// // Deleting a Booking
// .delete(
//   authController.restrictTo('admin', 'lead-guide'),
//   bookingController.deleteBooking
// );

// Implement all the missing endpoint all crud operations ( creating, reading, updating and reading operations)

router.use(authController.restrictTo('admin', 'user'));

// reading a Booking
router
  .route('/')
  .get(bookingController.getAllBooking)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
