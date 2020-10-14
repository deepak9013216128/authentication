const mongoose = require('mongoose');

const Schema = mongoose.Schema

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product'
        },
        quantity: {
          type: Number,
          required: true
        }
      }
    ]
  }
})

userSchema.methods.addToCart = function (product) {
  const cartItemIndex = this.cart.items.findIndex(cp => (
    cp.productId.toString() === product._id.toString()
  ))

  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartItemIndex >= 0) {
    newQuantity = this.cart.items[cartItemIndex].quantity + 1;
    updatedCartItems[cartItemIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({
      productId: product._id,
      quantity: 1
    })
  }

  const updatedCart = { items: updatedCartItems }
  this.cart = updatedCart;
  return this.save();
}

userSchema.methods.removeItemFromCart = function (productId) {
  const updatedCartItems = this.cart.items.filter(item => (
    item.productId.toString() !== productId.toString()
  ))
  this.cart.items = updatedCartItems
  return this.save();
}

userSchema.methods.clearCart = function () {
  this.cart = { items: [] }
  return this.save();
}

module.exports = mongoose.model('User', userSchema)

// const mongodb = require('mongodb')

// const getDb = require('../utils/database').getDb;

// const ObjectId = mongodb.ObjectId;

// class User {
//   constructor(username, email, cart, id) {
//     this.name = username;
//     this.email = email
//     this.cart = cart;
//     this._id = id;
//   }

//   save() {
//     const db = getDb();
//     return db.collection('user').insertOne(this)
//   }

//   addToCart(product) {
//     const cartItemIndex = this.cart.items.findIndex(cp => (
//       cp.productId.toString() === product._id.toString()
//     ))

//     let newQuantity = 1;
//     const updatedCartItems = [...this.cart.items];

//     if (cartItemIndex >= 0) {
//       newQuantity = this.cart.items[cartItemIndex].quantity + 1;
//       updatedCartItems[cartItemIndex].quantity = newQuantity;
//     } else {
//       updatedCartItems.push({ productId: new ObjectId(product._id), quantity: 1 })
//     }

//     const updatedCart = { items: updatedCartItems }
//     const db = getDb();

//     return db
//       .collection('users')
//       .updateOne(
//         { _id: new ObjectId(this._id) },
//         { $set: { cart: updatedCart } }
//       )
//   }

//   getCart() {
//     const db = getDb();
//     const productIds = this.cart.items.map(item => item.productId);
//     return db
//       .collection('products')
//       .find({ _id: { $in: productIds } })
//       .toArray()
//       .then(products => (
//         products.map(p => ({
//           ...p,
//           quantity: this.cart.items.find(item => (
//             item.productId.toString() === p._id.toString()
//           )).quantity
//         }))
//       ))
//   }

//   deleteItemFromCart(productId) {
//     const updatedCartItems = this.cart.items.filter(item => (
//       item.productId.toString() !== productId.toString()
//     ))

//     const db = getDb();

//     return db
//       .collection('users')
//       .updateOne(
//         { _id: new ObjectId(this._id) },
//         { $set: { cart: { items: updatedCartItems } } }
//       )
//   }

//   addOrder() {
//     const db = getDb()
//     return this.getCart()
//       .then(products => {
//         const order = {
//           items: products,
//           user: {
//             _id: new ObjectId(this._id),
//             name: this.name
//           }
//         };
//         return db.collection('orders').insertOne(order)

//       })
//       .then(result => {
//         this.cart = { items: [] }
//         return db
//           .collection('users')
//           .updateOne(
//             { _id: new ObjectId(this._id) },
//             { $set: { cart: { items: [] } } }
//           )
//       })
//   }

//   getOrders() {
//     const db = getDb();

//     return db
//       .collection('orders')
//       .find({ 'user._id': new ObjectId(this._id) })
//       .toArray()
//   }

//   static findById(userId) {
//     const db = getDb()
//     return db
//       .collection('users')
//       .findOne({ _id: new ObjectId(userId) })
//       .then(user => {
//         console.log(user)
//         return user;
//       })
//       .catch(err => console.log(err))
//   }
// }

// module.exports = User;