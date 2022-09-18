const mysql = require("mysql");
const dbConfig = require("../config/db.config.js");

// Create a connection to the database
const connection = mysql.createPool({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
  connectionLimit: 54,
  waitForConnections:true,
  queueLimit: 10000,
  connectTimeout: 15000,
  enableKeepAlive: true,
});



module.exports = connection;