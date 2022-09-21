const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('unhandledException', (err) => {
  //console.log(err.name, err.message);
  console.log('UNHANDLER Exception💥  Shutting down...');
  process.exit(1);
});
const app = require('./app');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() =>
  //console.log(con.connections);
  console.log('DB connection successful!')
);

// const testTour = new Tour({
//   name: 'The Forest Hikers',
//   rating: 4.7,
//   price: 490,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('Error', err);
//   });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  //console.log(err.name, err.message);
  console.log('UNHANDLER REJECTION💥  Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
