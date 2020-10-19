const { validationResult } = require('express-validator');

const Product = require('../models/product');
const fileHelper = require('../utils/file');

exports.getAddProduct = (req, res, next) => {
  // res.sendFile(path.join(rootDir, 'views', 'add-product.html'))
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  })
}

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/')
  }
  const { productId } = req.params;
  Product.findById(productId)
    .then(product => {
      if (!product) {
        return res.redirect('/')
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      })
    })
    .catch(err => console.log(err))
}

exports.postEditProduct = (req, res, next) => {
  const { productId } = req.body;
  const updatedTitle = req.body.title;
  const image = req.file;
  const updatedPrice = req.body.price;
  const updatedDesc = req.body.description;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: productId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }
  Product.findById(productId)
    .then(product => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/')
      }
      product.title = updatedTitle
      if (image) {
        fileHelper.deleteFile(product.imageUrl)
        product.imageUrl = image.path
      }
      product.price = updatedPrice
      product.description = updatedDesc
      return product.save()
        .then(() => {
          console.log('Product Updated!')
          res.redirect('/admin/products')
        })
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      next(error)
    })
}

exports.postAddProduct = (req, res, next) => {
  const { title, price, description } = req.body;
  const errors = validationResult(req);

  const image = req.file;
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      errorMessage: 'Attached file is not image!',
      validationErrors: [],
      product: { title, price, description }
    })
  }

  const imageUrl = image.path;

  if (!errors.isEmpty()) {
    console.log(errors.array())
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
      product: { title, price, description }
    })
  }

  const product = new Product({
    title,
    imageUrl,
    price,
    description,
    userId: req.session.user
  });

  product
    .save()
    .then(() => {
      console.log('Product Created!')
      res.redirect('/');
    })
    .catch(err => {
      // return res.status(500).render('admin/edit-product', {
      //   pageTitle: 'Add Product',
      //   path: '/admin/add-product',
      //   editing: false,
      //   hasError: true,
      //   product: {
      //     title: title,
      //     imageUrl: imageUrl,
      //     price: price,
      //     description: description
      //   },
      //   errorMessage: 'Database operation failed, please try again.',
      //   validationErrors: []
      // });
      // res.redirect('/500');
      const error = new Error(err)
      error.httpStatusCode = 500;
      next(error)
    })
}

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
      // console.log(products)
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
      })
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      next(error)
    })
}

exports.postDeleteProduct = (req, res, next) => {
  const { productId } = req.body;
  Product.findById(productId)
    .then(product => {
      if (!product) {
        throw new Error('Product not Found!')
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: productId, userId: req.user._id })
    })
    .then(() => {
      console.log('DELETE PRODUCT!')
      res.redirect('/admin/products')
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      next(error)
    })
}