//const Stripe = require('stripe');
import axios from 'axios';
import { showAlert } from './alerts';

// const stripe = Stripe(
//   'pk_test_51LjlghSBZ61FnUvK8u4Wz0mXSraKVwsbiqKl6rycXLOhoFVChgAY2WV3RdIEWgigJXq9DOBu9vUIWexYAHOSIJAg00uQPb66Yc'
// );

export const bookTour = async (tourID) => {
  try {
    // const stripe = Stripe(
    //   'pk_test_51LjlghSBZ61FnUvK8u4Wz0mXSraKVwsbiqKl6rycXLOhoFVChgAY2WV3RdIEWgigJXq9DOBu9vUIWexYAHOSIJAg00uQPb66Yc'
    // );
    //1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourID}`);
    //console.log(session);

    //2) create checkuot form + process/charge the credit card
    // await stripe.redirectToCheckout({
    //   sessionId: session.data.session.id,
    // });

    window.location.assign(session.data.session.url);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
