const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
  MongoClient.connect(
    'mongodb+srv://deepak:LHMWm5mwySFXRj8@nodejs.zz6dw.mongodb.net/nodejs?retryWrites=true&w=majority'
    , { useUnifiedTopology: true }
  )
    .then(client => {
      console.log('Database Conneted!')
      _db = client.db();
      callback()
    })
    .catch(err => console.log(err))
}

const getDb = () => {
  if (_db) {
    return _db
  }
  throw 'no Databse Found!'
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;