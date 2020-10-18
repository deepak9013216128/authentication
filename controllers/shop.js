const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
  // res.sendFile(path.join(rootDir, 'views', 'shop.html'))
  Product.find()
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
      })
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      next(error)
    })
}

exports.getProduct = (req, res, next) => {
  const { productId } = req.params;
  Product.findById(productId)
    .then(product => {
      if (product) {
        return res.render('shop/product-detail', {
          product,
          pageTitle: product.title,
          path: '/products',
        })
      }
      return res.redirect('/products')
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      next(error)
    })
}

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
      })
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      next(error)
    })
}

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items
      res.render('shop/cart', {
        pageTitle: 'Your Cart',
        path: '/cart',
        products,
      })
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      next(error)
    })
}

exports.postCart = (req, res, next) => {
  const { productId } = req.body;
  Product.findById(productId)
    .then(product => {
      return req.user.addToCart(product)
    })
    .then(result => {
      console.log(result)
      res.redirect('/cart')
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      next(error)
    })
}

exports.postDeleteCartProduct = (req, res, next) => {

  const { productId } = req.body;
  req.user
    .removeItemFromCart(productId)
    .then(() => console.log('PRODUCT DELETED!'))
    .then(() => res.redirect('/cart'))
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      next(error)
    })

}

exports.postOrders = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(item => ({
        quantity: item.quantity,
        product: { ...item.productId._doc }
      }))
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      })
      return order.save();
    })
    .then(() => req.user.clearCart())
    .then(result => {
      res.redirect('/orders')
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      next(error)
    })
}

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .exec()
    .then(orders => {
      res.render('shop/orders', {
        pageTitle: 'Your Orders',
        path: '/orders',
        orders: orders,
      })
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      next(error)
    })
}

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    pageTitle: 'Checkout',
    path: '/checkout'
  })
}