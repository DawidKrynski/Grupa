const path = require("path");
const { DataTypes, Sequelize } = require("sequelize");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.DB_FILE || "./database.sqlite",
    logging: false
});

const Product = sequelize.define("Product", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    description: {
        type: DataTypes.TEXT
    },
    imageUrl: {
        type: DataTypes.STRING
    }
});

module.exports = { sequelize, Product };
