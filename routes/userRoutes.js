const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
//const reviewController = require('../controllers/reviewController');

const router = express.Router();

router.post('/signup/', authController.signup);
router.post('/login/', authController.login);
router.get('/logout/', authController.logout);
router.post('/forgotPassword/', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Middleware there to make sure everything after is using the AuthController.protect.
router.use(authController.protect);

router.patch(
  '/updateMyPassword/',
  authController.protect,
  authController.updatePassword
);

router.get(
  '/me',
  // authController.protect,
  userController.getMe,
  userController.getUser
);
router.patch(
  '/updateMe/',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe/', authController.protect, userController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
