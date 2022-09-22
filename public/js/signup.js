/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';
export const signup = async (name, email, password, passwordConfirm) => {
  try {
    //console.log(email, password);

    const result = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name: name,
        email: email,
        password: password,
        passwordConfirm: passwordConfirm,
      },
    });
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

// export const logout = async (req, res) => {
//   try {
//     const result = await axios({
//       method: 'GET',
//       url: '/api/v1/users/logout',
//     });
//     //console.log(result);
//     if (result.data.status === 'success') {
//       location.reload(true);
//     }
//   } catch (err) {
//     showAlert('error', 'Error Logging out! Try Again');
//   }
// };
