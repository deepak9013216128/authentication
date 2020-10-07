exports.error404 = (req, res, next) => {
  // res.status(404).sendFile(path.join(__dirname, 'views', '404.html'))
  res.status(404).render('404', {
    pageTitle: 'Page not Found', path: req.url,
    isAuthenticated: req.session.isLoggedIn
  })
}