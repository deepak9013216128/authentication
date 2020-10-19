const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 1;

exports.getProducts = (req, res, next) => {
  // res.sendFile(path.join(rootDir, 'views', 'shop.html'))
  const page = +req.query.page || 1;
  let totalItems = 0;
  Product.find().countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
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
  const page = +req.query.page || 1;
  let totalItems = 0;
  Product.find().countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
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

exports.getInvoice = (req, res, next) => {
  const { orderId } = req.params;

  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return next(new Error('Order not found!'))
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized'))
      }
      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join('data', 'invoices', invoiceName)
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err)
      //   }
      //   res.setHeader('Content-Type', 'application/pdf')
      //   res.setHeader('Content-Dispositon', 'attachment; filename="' + invoiceName + '"')
      //   res.send(data)
      // })
      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Dispositon', 'attachment; filename="' + invoiceName + '"')
      pdfDoc.pipe(fs.createWriteStream(invoicePath))
      pdfDoc.pipe(res)

      pdfDoc.fontSize(26).text('Invoice', {
        align: 'center',
        underline: true
      })
      pdfDoc.moveDown(1)

      pdfDoc.fontSize(14)
        .text('Item', { align: 'left' })
        .moveUp(1)
        .text('Price', { align: 'right' })
      pdfDoc.fontSize(26).text('------------------------------------------------------', {
        align: 'center'
      })

      let totalPrice = 0;
      order.products.forEach(prod => {
        pdfDoc.fontSize(14)
          .text(`${prod.product.title}`, { align: 'left' })
          .moveUp(1)
          .text(` - `, { align: 'center' })
          .moveUp(1)
          .text(`${prod.quantity} X $${prod.product.price}`, { align: 'right' })
        totalPrice += prod.quantity * prod.product.price;
      })
      pdfDoc.fontSize(26).text('------------------------------------------------------', {
        align: 'center'
      })
      pdfDoc.fontSize(20).text(
        `Total Price : $${totalPrice}`,
        { align: 'center' }
      )
      pdfDoc.fontSize(14)
        .text('Quantity', 440, 132)
      pdfDoc.end();

      // const file = fs.createReadStream(invoicePath);
      // file.pipe(res)
    })
    .catch(err => next(err))
}