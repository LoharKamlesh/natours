//review/rating/createdAt/ref to tour/ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      require: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a author'],
    },
  },
  {
    //fields that are not stored in a database but calculated using some other value, but we want it to show up when there is a output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name',
  //   }).populate({
  //     path: 'user',
  //     select: 'name photo',
  //   });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

//Static method
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //this refers to current model
  const stats = await this.aggregate([
    {
      //1st stage to select all the reviews that actually belongs to the current tourId/tour that was passed in as the argument
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour', //to group entities by common parameter..in tourcontroler we group them by difficulty but here we want to group reviews by their common tourId
        numRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  //this points to current review.
  //Review.calcAverageRatings(this.tour) //Review is not define yet also cant shift this down bcoz reviewschema wont be having this post middleware as we will do it in next line.
  this.constructor.calcAverageRatings(this.tour);
});

//findByIdAndUpdate()
//findByIdAndDelete()
//these are query middleware and have access to only query but here we want access to document(tour) inorder to get review from that doc.
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.rev = await this.clone().findOne(); //by using this.rev(it is Model) we create a property on document so that we can use it in next middleware
  console.log(this.rev);
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  await this.rev.constructor.calcAverageRatings(this.rev.tour);
  //console.log(this.rev);
});

//Create and export the model
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

//review needs to belong to a tour and it also needs an author
//do parent referencing
