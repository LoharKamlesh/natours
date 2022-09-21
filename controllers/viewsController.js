const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const Booking = require('../models/bookingModel');

exports.getOverview = async (req, res, next) => {
  try {
    //1) Get tour data from collection
    const tours = await Tour.find();
    res.status(200).render('overview', {
      title: 'All Tours',
      tours: tours,
    });
  } catch (err) {
    console.log(err);
  }

  //2) Build template

  //3) render that template using tour data from 1)
};

exports.getTour = async (req, res, next) => {
  try {
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
    });
    if (!tour) {
      return next(new AppError('There is no tour with that name', 404));
    }
    res.status(200).render('tour', {
      title: `${tour.name} Tour`,
      tour,
    });

    //2) Build template

    //3) render that template using tour data from 1)
  } catch (err) {
    console.log(err);
  }
};
exports.getMyTours = async (req, res, next) => {
  //1)Find all bookings
  const bookings = await Booking.find({
    user: req.user.id,
  });

  //2) find tours with returned ID's from above
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
};

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account',
  });
};

exports.updateUserData = async (req, res, next) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name: req.body.name,
        email: req.body.email,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).render('account', {
      title: 'Your Account',
      user: updatedUser,
    });
  } catch (err) {
    console.log(err);
  }
};
