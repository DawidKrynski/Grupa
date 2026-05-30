const { DataTypes, Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_FILE || "repair-service.sqlite",
  logging: false
});

const RepairService = sequelize.define("RepairService", {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  durationHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
});

const Repair = sequelize.define("Repair", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  bikeDescription: {
    type: DataTypes.STRING,
    allowNull: false
  },
  issueDescription: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  dropOffDate: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "2026-06-02"
  },
  readyDate: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "2026-06-02"
  },
  plannedHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  status: {
    type: DataTypes.ENUM("booked", "accepted", "in_progress", "ready", "completed", "cancelled"),
    allowNull: false,
    defaultValue: "booked"
  }
});

RepairService.hasMany(Repair);
Repair.belongsTo(RepairService);

module.exports = { sequelize, RepairService, Repair };
