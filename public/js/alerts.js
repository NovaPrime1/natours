/* eslint-disable */

export const hideAlert = () => {
  const el = document.querySelector('.alert');
  //DOM manipulation
  if (el) el.parentElement.removeChild(el);
};

//type is success or error
// Very simple alert based on type and message
export const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};
