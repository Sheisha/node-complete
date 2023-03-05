const mongodb =  require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db; 

const mongoConnect = (callback) => {
    MongoClient.connect('mongodb+srv://admin-alexia:test123@cluster0.j4yjtgd.mongodb.net/shop?retryWrites=true&w=majority')
    .then(client => {
        console.log('Connected!');
        _db = client.db();
        callback();
    })
    .catch(err => {
        console.log(err);
        throw err;
    });
};

const getDb = () => {
    if(_db) {
        return _db;
    }
    throw 'No database found!';
};

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;


//FOR SEQUELIZE
// const Sequelize = require('sequelize');

// const sequelize = new Sequelize('node-complete',  'root', 'creative1', {
//     dialect: 'mysql', 
//     host: 'localhost'
// });

// module.exports = sequelize;


// FOR SQL
// const mysql = require('mysql2');

// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     database: 'node-complete',
//     password: 'creative1'
// });

// module.exports = pool.promise();