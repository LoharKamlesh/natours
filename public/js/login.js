/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';
export const login = async (email, password) => {
  try {
    //console.log(email, password);

    const result = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:5000/api/v1/users/login',
      data: {
        email: email,
        password: password,
      },
    });
    if (result.data.status === 'success') {
      showAlert('success', 'logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async (req, res) => {
  try {
    const result = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:5000/api/v1/users/logout',
    });
    console.log(result);
    if (result.data.status === 'success') {
      location.reload(true);
    }
  } catch (err) {
    showAlert('error', 'Error Logging out! Try Again');
  }
};
