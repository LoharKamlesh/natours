const AppError = require('../utils/appError');
//const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      error: err,
    });
  }
};

exports.updateOne = (Model) => async (req, res, next) => {
  try {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  } catch (err) {
    return next(new AppError(`${err}`, 404));
    // res.status(400).json({
    //   status: 'fail',
    //   error: err,
    // });
  }
};

exports.createOne = (Model) => async (req, res, next) => {
  try {
    ///creating documents
    //1) const newTour= new Tour();
    // newTour.save()

    //2)
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  } catch (err) {
    return next(new AppError(`${err}`, 404));
    // res.status(400).json({
    //   status: 'fail',
    //   error: err,
    // });
  }
};

exports.getOne = (Model, popOptions) => async (req, res, next) => {
  try {
    let query = Model.findById(req.params.id);
    if (popOptions) {
      query = query.populate('reviews');
    }
    const doc = await query;
    if (!doc) {
      return next(new AppError('No tour found with that ID', 404));
      // return res.status(404).json({
      //   status: 'fail',
      //   message: 'No document found with that ID',
      // });
    }
    //Tour.findOne({ _id: req.params.id })
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc, //:tours is the actual data and tours: is the resource
      },
    });
  } catch (err) {
    return next(new AppError(`${err}`, 404));
  }
};

// exports.getAll = (Model) => async (req, res, next) => {
//   //console.log(req.requestTime);

//   try {
//     //To allow for nested GET reviews on tour(hack)
//     let filter = {};
//     if (req.params.tourId) {
//       filter = {
//         tour: req.params.tourId,
//       };
//       //EXECUTE QUERY
//       const features = new APIFeatures(Model.find(filter), req.query)
//         .filter()
//         .sort()
//         .limitFields()
//         .paginate();

//       //Tour.find() is an query object
//       //req.query is an query string coming from express
//       const doc = await features.query;
//       //console.log(doc);

//       //const tours = await Tour.find();

//       //SEND RESPONSE
//       res.status(200).json({
//         status: 'success',
//         requestedAt: req.requestTime,
//         results: doc.length,
//         data: {
//           data: doc, //:tours is the actual data and tours: is the resource
//         },
//       });
//     }
//   } catch (err) {
//     return next(new AppError(`${err}`, 404));
//   }
// };
