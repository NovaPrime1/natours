/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// This is an HTTP request or call axios request  which returns a promise
export const login = async (email, password) => {
  //const login = async (email, password) => {
  // Axios will return an error if there is one so we can use a try catch block
  //console.log('We are in the login function of login.js');
  try {
    const res = await axios({
      method: 'POST',
      url: 'api/V1/users/login',
      data: {
        email,
        password
      }
    });

    if (res.data.status === 'success') {
      // console.log('Right before the windows alert');
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
        // We want to go back to the home page after 1500 Milliseconds
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'api/V1/users/logout'
    });
    // This will restore a fresh page not one from cache like we do mannually, however we will pass an empty on or one that expires quickly
    if (res.data.status === 'success') location.reload(true);
  } catch (err) {
    showAlert('error', 'Error logging out! Try again');
  }
};

// Used to walk back the problem. [ Problem here. Was not creating the token perhaps call the form incorrectly]
// document.querySelector('.form').addEventListener('submit', e => {
//   e.preventDefault();
//   const email = document.getElementById('email').value;
//   const password = document.getElementById('password').value;
//   login(email, password);
// });
