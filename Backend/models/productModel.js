const db = require('../config/db');
const { DataTypes } = require('sequelize');
const Category = require('./categoryModel');
const Vendor = require('./vendorModel');

// Define Product model
const Product = db.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isVeg: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isBestseller: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

// Setup relationships
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Vendor.hasMany(Product, { foreignKey: 'vendorId', as: 'products' });
Product.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });

module.exports = Product;
