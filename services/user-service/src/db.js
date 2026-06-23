const path = require("path");
const { DataTypes, Sequelize } = require("sequelize");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_FILE || "user-service.sqlite",
  logging: false
});

const User = sequelize.define("User", {
  login: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 254]
    },
    set(value) {
      this.setDataValue("login", typeof value === "string" ? value.trim().toLowerCase() : value);
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      len: [1, 254]
    },
    set(value) {
      this.setDataValue("email", typeof value === "string" ? value.trim().toLowerCase() : value);
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM("customer", "admin"),
    allowNull: false,
    defaultValue: "customer"
  }
}, {
  indexes: [
    { unique: true, fields: ["login"] },
    { unique: true, fields: ["email"] }
  ]
});

module.exports = { sequelize, User };
