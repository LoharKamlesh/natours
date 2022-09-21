const express = require('express');

const authController = require('../controllers/authController');

const reviewController = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });
//we need mergeParams bcoz each router has access to the parameter to their specific routes, but here in below url post method there is no tourId which we need to createReview on soecific tour, if user dont provide tourId in body.

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
