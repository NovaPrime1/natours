/* eslint-disable */

import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { showAlert } from './alerts';
import { bookTour } from './stripe';

// you can play with the may and make changes later. His version was 0.54 in the tour.pug page.
// The below line of code was imported from the mapbox file.
// Created problem when a page does not have map

// Create DOM ELEMENTS
const mapBox = document.getElementById('map');
// Problem was here. I was doing getElementById instead of document.querySelector as done previously
const loginForm = document.querySelector('.form--login');
// Note you can also use an id here but either is fine.
const logOutBtn = document.querySelector('.nav__el--logout');
// This will be for updating settings
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
// Select element from webpage
const bookBtn = document.getElementById('book-tour');

//const checkBtn = document.querySelector('check-button');
// const checkBtn = document.getElementById('check-button');

//DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

// See the event listener on the login form.
if (loginForm)
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

if (logOutBtn) logOutBtn.addEventListener('click', logout);

// See the event listener on the updateSettings form.
if (userDataForm)
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);

    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    // Call the function we imported.
    updateSettings(form, 'data');
  });

// See the event listener on the updateSettings form.
if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating....';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    console.log(passwordCurrent, password, passwordConfirm);

    // Call the function we imported.
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    // AFter the api call we want to set these fields to empty
    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

// if (checkBtn)
//   checkBtn.addEventListener('click', e => {
//     e.preventDefault();
//     console.log(' Inside Event listener for checkBtn');
//     // alert(' You have clicked this check-button');
//     showAlert(' You have clicked this check-button');
//   });

if (bookBtn)
  bookBtn.addEventListener('click', e => {
    // alert(' You have clicked the booking button');
    //     // Once the button is click we change the context on that button
    e.target.textContent = 'Processing...';
    //     // we get the tourId from the attribute that on the buttin
    const { tourId } = e.target.dataset;
    // //     // then call booktour with that id
    //bookTour(tourId);
  });
