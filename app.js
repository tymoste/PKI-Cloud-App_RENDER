const { google } = require('googleapis');
const OAuth2Data = require('./google_key.json')

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var gloginRouter = require('./routes/glogin');
var gitloginRouter = require('./routes/gitlogin')

var app = express();

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris;

app.locals.oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)
app.locals.authed = false;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/glogin', gloginRouter);
app.use('/gitlogin', gitloginRouter);

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

module.exports = app;
