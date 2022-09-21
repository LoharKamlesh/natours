const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const factory = require('./handlerfactory');

//exports.getAllReviews = factory.getAll(Review);
exports.getAllReviews = async (req, res, next) => {
  try {
    let filter = {};
    if (req.params.tourId) {
      filter = {
        tour: req.params.tourId,
      };
    }
    const reviews = await Review.find(filter);

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: {
        reviews,
      },
    });
  } catch (err) {
    return next(new AppError(`${err}`, 404));
  }
};

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }
  if (!req.body.user) {
    req.body.user = req.user.id; //we get req.user from protect middleware
  }
  next();
};

// exports.createReview = async (req, res, next) => {
//   try {
//     // if (!req.body.tour) {
//     //   req.body.tour = req.params.tourId;
//     // }
//     // if (!req.body.user) {
//     //   req.body.user = req.user.id; //we get req.user from protect middleware
//     // }
//     const newReview = await Review.create(req.body);
//     res.status(200).json({
//       status: 'success',
//       data: {
//         review: newReview,
//       },
//     });
//   } catch (err) {
//     return next(new AppError(`${err}`, 404));
//   }
// };

exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
