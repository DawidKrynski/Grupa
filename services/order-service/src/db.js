const path = require("path");
const { DataTypes, Sequelize } = require("sequelize");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_FILE || "order-service.sqlite",
  logging: false
});

const ORDER_STATUSES = ["pending", "paid", "failed", "shipped", "completed", "cancelled"];

const Order = sequelize.define("Order", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deliveryAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(...ORDER_STATUSES),
    allowNull: false,
    defaultValue: "pending"
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  paymentTransactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentMessage: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

const OrderItem = sequelize.define("OrderItem", {
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unitPrice: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
});

Order.hasMany(OrderItem);
OrderItem.belongsTo(Order);

module.exports = { sequelize, Order, OrderItem, ORDER_STATUSES };
