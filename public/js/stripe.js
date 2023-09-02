/* eslint-disable */
// ES6 module syntax

import axios from 'axios';
import { showAlert } from './alerts';
// import { loadStripe } from '@stripe/stripe-js';

//1) const stripe = Stripe(
//   'pk_test_51NijlBE0tjP26yQQnn4laLXCFyKcxuejlQsDqC81zZBP4jO5HC4SXLuFCqXGgFmgejxSp8W0WqPASTUHBo8dOVNa00dNh2b1m5',
//   'en'
// );

//2) const stripe = Stripe(process.env.STRIPE_PUBLISHABLE_KEY);

//3)  const stripe = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY); // waiting on a promise so I need await. Await has to be with a async

//4)  const stripe = Stripe.setPublishableKey(
//   process.env.STRIPE_PUBLISHABLE_KEY,
//   'en'
// );

//5) const stripe = await loadStripe(process.env.STRIPE_PUBLISHABLE_KEY); // This is where it is falling apart.

// method: 'GET',
// url: `http://localhost:3000/api/V1/bookings/checkout-session/${tourId}`

export const bookTour = async tourId => {
  try {
    // 1) get the checkout session from endpoint or api
    //This id is from the index.js bookTour and this should return a check out session.
    // console.log(' Inside the axios call for bookTour');

    const session = await axios(
      `http://localhost:3000/api/V1/bookings/checkout-session/${tourId}`
    );

    // Get session from AJAX calll then call the backend bookingController method, remember to import the controler and pass in parm

    console.log(' Right after the AJAX call');

    // const app = express();

    // app.get(`${session.data.session.cancel_url}`, function(req, res) {
    //   // On getting the home route request,
    //   // the user will be redirected to GFG website
    //   res.redirect(`${session.data.session.url}`);
    // });

    // Let take a look at our session object.
    // console.log(session);
    // console.log(`This session url: ${session.url}`);

    // 2) Create checkout form + charge credit card old
    // Please not redirectToCheckout has been deprecated so we need something else to send to Checkout page.
    // await stripe.redirectToCheckout({
    //   sessionId: session.data.session.id
    // });

    // res.send({ url: session.url });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
