const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const methodOverride = require('method-override');
const config = require('./config');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const crypto = require('crypto');
const cors = require('cors');
const listEndpoints = require('express-list-endpoints')

const imageRouter = require('./routes/image');
const videoRouter = require('./routes/video');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors({
    origin: '*',
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const url = config.mongoURI;
const connect = mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

// connect to the database
connect.then(() => {
  console.log('Connected to database: GridApp');
}, (err) => console.log(err));

/* 
    GridFs Configuration
*/
var listener = app.listen(3000, function(){
    console.log('Listening on port ' + listener.address().port); //Listening on port 3000
});
// create storage engine
const imageStorage = new GridFsStorage({
    url: config.mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'images'
                };
                resolve(fileInfo);
            });
        });
    }
});

// create storage engine
const videoStorage = new GridFsStorage({
  url: config.mongoURI,
  file: (req, file) => {
      return new Promise((resolve, reject) => {
          crypto.randomBytes(16, (err, buf) => {
              if (err) {
                  return reject(err);
              }
              const filename = buf.toString('hex') + path.extname(file.originalname);
              const fileInfo = {
                  filename: filename,
                  bucketName: 'images'
              };
              resolve(fileInfo);
          });
      });
  }
});

const imageUpload = multer({ imageStorage });
const videUpload = multer({ videoStorage });

app.use('/image', imageRouter(imageUpload));
app.use('/video', videoRouter(videUpload));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
app.route('/')
.all(function namedMiddleware(req, res) {
  // Handle request
})
.get(function(req, res) {
  // Handle request
})
.post(function(req, res) {
  // Handle request
});

app.route('/about')
.get(function(req, res) {
  // Handle request
});

console.log(listEndpoints(app));
module.exports = app;
