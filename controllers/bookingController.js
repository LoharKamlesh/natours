const Stripe = require('stripe');

const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');

const AppError = require('../utils/appError');
//const APIFeatures = require('../utils/apiFeatures');
const factory = require('./handlerfactory');

exports.getCheckoutSession = async (req, res, next) => {
  try {
    //1) Get the currently booked tour
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const tour = await Tour.findById(req.params.tourID);
    console.log(req.params.tourID);

    //2) Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      success_url: `${req.protocol}://${req.get('host')}/?tour=${
        req.params.tourID
      }&user=${req.user.id}&price=${tour.price}`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourID,
      mode: 'payment',
      line_items: [
        {
          //       name: `${tour.name} Tour`,
          //       //description: `${tour.summary}`,
          //       //   images: ['http://127.0.0.1:5000/img/tours/tour-1-cover.jpg'],
          quantity: 1,
          price_data: {
            currency: 'inr',

            unit_amount: tour.price * 100,
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              //images: [`https:/www.natours.dev//img/tours/${tour.imageCover}`],
            },
          },
          //       //   currency: 'inr',
          //       //   quantity: 1,
        },
      ],
    });

    //3) Create session as response
    res.status(200).json({
      status: 'success',
      session,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.createBookingCheckout = async (req, res, next) => {
  //This is only temporary bcoz its unsecured everyone can make booking without paying
  console.log(req.query);
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) {
    return next();
  }
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
//exports.getAllBookings = factory.getAll(Booking);
exports.getAllBookings = async (req, res) => {
  try {
    //console.log(req.body);
    const bookings = await Booking.find();
    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: {
        bookings,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
};
