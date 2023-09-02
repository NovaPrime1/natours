const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
//const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Keep in mind that a router is just middleware and you are mounting a router here.
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats/').get(tourController.getTourStats);
router
  .route(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    '/monthly-plan/:year'
  )
  .get(tourController.getMonthlyPlan);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getTourWithin);
// /tours-distance?distance=233, center-40, 45&unit=mi - using query strings
// /tours-distance/233/center/-40,45/unit/mi - much cleaner way of specifying url.

router.route('/distances/:latlng/unit/:unit').all(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImage,
    tourController.updateTour
  )

  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
