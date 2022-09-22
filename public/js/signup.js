/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';
export const signup = async (name, email, password, passwordConfirm) => {
  try {
    //console.log(email, password);

    const result = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:5000/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });
    console.log(result);
    if (result.data.status === 'success') {
      showAlert('success', 'signed in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
