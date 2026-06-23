async function tableExists(queryInterface, tableName) {
  const tables = await queryInterface.showAllTables();
  return tables.some((table) => {
    const currentName = typeof table === "string" ? table : table.tableName;
    return currentName === tableName;
  });
}

async function indexExists(queryInterface, tableName, indexName) {
  if (!(await tableExists(queryInterface, tableName))) {
    return false;
  }

  const indexes = await queryInterface.showIndex(tableName);
  return indexes.some((index) => index.name === indexName);
}

async function ensureUniqueIndex(queryInterface, tableName, fields, indexName) {
  if (await indexExists(queryInterface, tableName, indexName)) {
    return;
  }

  await queryInterface.addIndex(tableName, fields, {
    unique: true,
    name: indexName
  });
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const usersTable = "Users";

    if (!(await tableExists(queryInterface, usersTable))) {
      await queryInterface.createTable(usersTable, {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        login: {
          type: Sequelize.STRING,
          allowNull: false
        },
        firstName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        lastName: {
          type: Sequelize.STRING,
          allowNull: false
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false
        },
        passwordHash: {
          type: Sequelize.STRING,
          allowNull: false
        },
        role: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: "customer"
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

    await ensureUniqueIndex(queryInterface, usersTable, ["login"], "users_login_unique");
    await ensureUniqueIndex(queryInterface, usersTable, ["email"], "users_email_unique");
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Users");
  }
};
