const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer')
const sendgridTransport = require('nodemailer-sendgrid-transport');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: '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',
  }
}))

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    pageTitle: 'Sign Up',
    path: '/signup',
    errorMessage: message
  })
}

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        req.flash('error', 'Invalid email and password.')
        return res.redirect('/login')
      }
      bcrypt.compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err)
              res.redirect('/');
            })
          }
          req.flash('error', 'Invalid email and password.')
          res.redirect('/login')
        })
        .catch(err => {
          console.log(err)
          req.flash('error', 'Invalid email and password.')
          return res.redirect('/login')
        })

    })
    .catch(err => console.log(err))
};

exports.postSignup = (req, res, next) => {
  const { email, password, confirnPassword } = req.body;

  User.findOne({ email: email })
    .then(userDoc => {
      if (userDoc) {
        req.flash('error', 'User already exist, please pick another Email Id')
        return res.redirect('/signup')
      }
      return bcrypt.hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            email,
            password: hashedPassword,
            cart: { items: [] }
          })
          return user.save();
        })
        .then(result => {
          res.redirect('/login')
          return transporter.sendMail({
            to: email,
            from: 'deepak9692031@gmail.com',
            subject: 'Signup succeeded!',
            html: '<h1>You successfully signed up!</h1>'
          })
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
}

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err)
    res.redirect('/')
  })
};
