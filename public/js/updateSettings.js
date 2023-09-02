/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// This is an HTTP request or call axios request  which returns a promise
// Type is either password or data
export const updateSettings = async (data, type) => {
  // Axios will return an error if there is one so we can use a try catch block
  try {
    const url =
      type === 'password'
        ? 'http://localhost:3000/api/V1/users/updateMyPassword'
        : 'http://localhost:3000/api/V1/users/updateMe';

    // Ajax request to the server.
    const res = await axios({
      method: 'PATCH',
      url,
      data
    });

    if (res.data.status === 'success') {
      // console.log('Right before the windows alert');
      showAlert(
        'success',
        `${type.toUpperCase()}
        Data has been updated successfully!`
      );
      // window.setTimeout(() => {
      //   location.assign('/api/users/');
      //   // We want to go back to the home page after 1500 Milliseconds
      // }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
