const Sequelize = require('sequelize');
require('dotenv').config();

// Choose connection URI if available, otherwise construct from components
const connectionUri = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
const database = process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'zamato';
const username = process.env.MYSQL_USER || process.env.MYSQLUSER || 'root';
const password = process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || 'Dhanu@1234';
const host = process.env.MYSQL_HOST || process.env.MYSQLHOST || 'localhost';
const port = process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306;

const options = {
  host,
  port,
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    // Railway MySQL connection configurations can sometimes require SSL settings
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
  }
};

// Initialize Sequelize connection
const db = connectionUri
  ? new Sequelize(connectionUri, { ...options, dialect: 'mysql' })
  : new Sequelize(database, username, password, options);

module.exports = db;
