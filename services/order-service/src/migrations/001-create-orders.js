async function tableExists(queryInterface, tableName) {
  const tables = await queryInterface.showAllTables();
  return tables.some((table) => {
    const currentName = typeof table === "string" ? table : table.tableName;
    return currentName === tableName;
  });
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const ordersTable = "Orders";
    const orderItemsTable = "OrderItems";

    if (!(await tableExists(queryInterface, ordersTable))) {
      await queryInterface.createTable(ordersTable, {
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
        deliveryAddress: {
          type: Sequelize.STRING,
          allowNull: false
        },
        paymentMethod: {
          type: Sequelize.STRING,
          allowNull: false
        },
        status: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: "pending"
        },
        totalAmount: {
          type: Sequelize.FLOAT,
          allowNull: false,
          defaultValue: 0
        },
        paymentTransactionId: {
          type: Sequelize.STRING,
          allowNull: true
        },
        paymentMessage: {
          type: Sequelize.STRING,
          allowNull: true
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

    if (!(await tableExists(queryInterface, orderItemsTable))) {
      await queryInterface.createTable(orderItemsTable, {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        productId: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        productName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        quantity: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        unitPrice: {
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
        },
        OrderId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: ordersTable,
            key: "id"
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL"
        }
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("OrderItems");
    await queryInterface.dropTable("Orders");
  }
};
