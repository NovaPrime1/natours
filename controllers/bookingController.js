const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  // console.log(tour);

  //2) Create the checkout session. Below is the information about the session. API call which is an async function which we should await.
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // This is not secure because you could do a sql injection. But for now as a work around it will work because we will hide it.
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    // success_url: `http://localhost:3000/`,
    // cancel_url: `http://localhost:3000/tour/${tour.slug}`,
    customer_email: req.user.email,
    //Allow us to pass in some data about the session we are already creating.
    client_reference_id: req.params.tourId,
    // Here is the information about the product
    // line_items: [
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`
          },
          unit_amount: tour.price * 100
        },
        quantity: 1
      }

      //   name: `${tour.name} Tour`,
      //   description: tour.summary,
      //   images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
      //   price: [
      //     {
      //       unit_amount: tour.price * 100
      //     }
      //   ],
      //   currency: 'usd',
      //   quantity: 1
      // }
    ],
    mode: 'payment'
  });

  //3) send to client
  res
    // .redirect(`${session.url}`)
    .status(200)
    .json({
      status: 'success',
      session
    });
  // console.log(`Here is the session url ${session.data.session.url}`);
  // res.send(session.data.session.url);
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only temporary because it is unsecure. Every if you know the url can make booking without paying.
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  // This redirect is to mask the url and go back to everything before the "?" then call the next middlware in the stack until we get back to the home page. (spomewhat circlular)
  res.redirect(req.originalUrl.split('?')[0]);

  // Go to the next middleware. What is the next middleware?
});

exports.createBooking = factory.createOne(Booking); // Looks like we need this one
exports.getAllBooking = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
