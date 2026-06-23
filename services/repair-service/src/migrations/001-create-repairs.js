async function tableExists(queryInterface, tableName) {
  const tables = await queryInterface.showAllTables();
  return tables.some((table) => {
    const currentName = typeof table === "string" ? table : table.tableName;
    return currentName === tableName;
  });
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const repairServicesTable = "RepairServices";
    const repairsTable = "Repairs";

    if (!(await tableExists(queryInterface, repairServicesTable))) {
      await queryInterface.createTable(repairServicesTable, {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        durationHours: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        price: {
          type: Sequelize.FLOAT,
          allowNull: false
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });
    }

    if (!(await tableExists(queryInterface, repairsTable))) {
      await queryInterface.createTable(repairsTable, {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        userEmail: {
          type: Sequelize.STRING,
          allowNull: false
        },
        productId: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        bikeDescription: {
          type: Sequelize.STRING,
          allowNull: false
        },
        issueDescription: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        dropOffDate: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: "2026-06-02"
        },
        readyDate: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: "2026-06-02"
        },
        plannedHours: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: "booked"
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        RepairServiceId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: repairServicesTable,
            key: "id"
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL"
        }
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Repairs");
    await queryInterface.dropTable("RepairServices");
  }
};
