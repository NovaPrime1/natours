const User = require('../models/userModel');
const sharp = require('sharp');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-87888adfa-33326587444.jpeg -- make sure uniqueness
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext})`);
//   }
// });

//This image is stored as a buffer. We simply keep it in memory instead of writting it a file system and pulling it
const multerStorage = multer.memoryStorage();

// This is a filter to make sure this is a image file.
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an  image1 Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg)`;

  // resizing and crop the image to cover the right dimentions. You can also set additonal options
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

// Explaination: When filterObj method is called - obj=req.body, ...allowedFields=name, email
//
const filterObj = (obj, ...allowedFields) => {
  // creating a new empty object
  const newObj = {};
  // loop through the object and only return the fields we need.
  //Object.keys(key) return an array containing all the key name so we can loop through them
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;

  // Basically looping through each element and putting the allowfield in a separate object for later use.
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  // delete a user by updated the active flage
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});
exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  // 1) Create error if user post password data
  //console.log('In the update me method before if condition');
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMypassword.',
        400
      )
    );
  }

  //Update user document
  // don't use req.body because allow user to change role or token. Need to make sure object
  // only contains the things we want to update.
  // This allows us to filter only these thing from the body.
  // 2) Filtered out unwanted fields name that are not allowed
  const filteredBody = filterObj(req.body, 'name', 'email');

  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
    // You can use the *save function
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use sign up instead'
  });
};

// Using Factory methods
exports.getAllUsers = factory.getAll(User);
// Do NOT update passwords with this update User method.
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
