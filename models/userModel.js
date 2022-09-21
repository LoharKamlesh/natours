const crypto = require('crypto'); //to generate random string
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
//name, email, photo, password, passwordconfirm
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
    maxlength: [40, 'User name must be less than 40 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide us your email'],
    unique: [true, 'email must be unique'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'defaultnew.jpg',
    //required: [true, 'A user must have a photo'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be atleast 8 character long'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    //custorm validator
    validate: {
      // This works only on .create() and .save()
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password are not the same!',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//use pre save middleware to encrypt password
userSchema.pre('save', async function (next) {
  //we have to encrypt password only if password has been updated or created
  //'this' here on document is the user
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12); //hash is async function

  this.passwordConfirm = undefined; //we dont want to persist passwordConfirm to database we just need it in early stages to validate user entered password

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 2000; //-2000 bcoz at times token is issued first and then passwordChangedAT time is assigned so user wont be able to login in that case. so we substact 2 seconds from time so that it will show that token was assigned after password change.
  next();
});

userSchema.pre(/^find/, function (next) {
  //This points to current query
  this.find({ active: { $ne: false } });
  next();
});

//Instance method will be available on all the documents of the certain collection

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    ); //10 is base number to convert into decimal
    //console.log(changedTimeStamp, JWTTimeStamp);
    return JWTTimeStamp < changedTimeStamp; //100<200 time at which we were issued token<time AT which we change password
  }

  //flase means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex'); //sha256 is algorithm to encrypt passwords

  //console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
