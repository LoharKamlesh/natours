const AppError = require('../utils/appError');
const User = require('../models/userModel');
const factory = require('./handlerfactory');
const multer = require('multer'); //middleware to upload photos in form
const sharp = require('sharp'); //image procesing library for node js(to resize img)

// const multerStorage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     callback(null, 'public/img/users');
//   },
//   filename: (req, file, callback) => {
//     //user-878428hdhfkymxhc-124512154.jpeg
//     const ext = file.mimetype.split('/')[1]; //to get extension as jpeg
//     callback(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage(); //store image in buffer

const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image')) {
    callback(null, true);
  } else {
    callback(
      new AppError('Not an image! Please upload only images.', 400),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({
        quality: 90,
      })
      .toFile(`public/img/users/${req.file.filename}`);

    next();
  } catch (err) {
    console.log(err);
  }
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = async (req, res, next) => {
  try {
    //1)Create error if user POSTs password data
    //console.log(req.file);
    //console.log(req.body);

    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password updates. Please use /updateMyPassword',
          400
        )
      );
    }
    //2)filter out unwanted fields name that are not alowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) {
      filteredBody.photo = req.file.filename;
    }
    //3)Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    //return next(new AppError('Fields not updated. Please try again.'));
    res.status(400).json({
      status: 'fail',
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
};
exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use /signup instead.',
  });
};

//exports.getAllUsers = factory.getAll(User);
exports.getAllUsers = async (req, res) => {
  try {
    //console.log(req.body);
    const users = await User.find();
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        user: users,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
};

exports.getUser = factory.getOne(User);
// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };
// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };

//Do NOT update password with this!!!
exports.updateUser = factory.updateOne(User); //this is only for admins and it does not update password. whenever we run findByIdAndUpdate() all the save middleware is not run
exports.deleteUser = factory.deleteOne(User);
