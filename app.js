const exress = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const mongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid')

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI = 'mongodb+srv://deepak:LHMWm5mwySFXRj8@nodejs.zz6dw.mongodb.net/nodejs?retryWrites=true&w=majority';

const app = exress();
const store = new mongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
})
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images')
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + '-' + file.originalname)
  }
})

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

app.set('view engine', 'ejs');
app.set('views', 'views')

app.use(exress.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'))
app.use(exress.static(path.join(__dirname, 'public')))
app.use('/images', exress.static(path.join(__dirname, 'images')))
app.use(session({
  secret: 'my secret',
  resave: false,
  saveUninitialized: false,
  store: store
}))
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        next();
      }
      req.user = user;
      next()
    })
    .catch(err => {
      next(new Error(err))
    })
})

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn
  res.locals.csrfToken = req.csrfToken()
  next();
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes)

app.get('/500', errorController.error500)
app.use(errorController.error404)

app.use((error, req, res, next) => {
  // res.status(error.httpStatusCode).send(data)
  res.redirect('/500')
})

mongoose.connect(
  MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  }
)
  .then(() => {
    app.listen(3000, () =>
      console.log('server is listening on port 3000')
    );
  })
