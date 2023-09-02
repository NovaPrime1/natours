const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Should be a the beginning so we can start listening before any other code is executed
process.on('uncaughtExceptions', err => {
  console.log('Uncaught exception *** Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

// console.log(app.get('env'));
// console.log(process.env);

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful'));
// .catch(err => console.log('ERROR')); -- easy way

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Capturing the bad unhandled exception more cleanly but this verion of node does it automatically.
process.on('unhandledRejection', err => {
  console.log('Unhandled Rejection *** -- CRASH!! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// console.log(x);
